import { z } from "zod";
import type { SqlParameter } from "@azure/cosmos";

import { cosmosEnabled, getContainer } from "@/lib/cosmos";
import type { BlogPost, ProductArea } from "@/lib/types";
import { slugify } from "@/lib/slug";

const POSTS_CONTAINER = process.env.COSMOS_POSTS_CONTAINER_ID || "posts";

const productAreaSchema = z.enum(["teams", "intune", "entra"]);

export const createPostInputSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(400).optional().default(""),
  bodyMarkdown: z.string().optional().default(""),
  productArea: productAreaSchema.default("teams"),
  tags: z.array(z.string()).optional().default([]),
  slug: z.string().max(200).optional(),
});

export const updatePostInputSchema = createPostInputSchema.partial().extend({
  status: z.enum(["draft", "published"]).optional(),
});

type CreatePostInput = z.infer<typeof createPostInputSchema>;
type UpdatePostInput = z.infer<typeof updatePostInputSchema>;

const nowIso = () => new Date().toISOString();

const inMemory = {
  posts: new Map<string, BlogPost>(),
};

function seedInMemoryOnce() {
  if (inMemory.posts.size > 0) return;

  const createdAt = nowIso();
  const sample: BlogPost = {
    type: "post",
    pk: "post",
    id: "sample-1",
    slug: "welcome",
    title: "Welcome",
    summary: "First post — wire up Cosmos DB and start publishing.",
    bodyMarkdown:
      "# Welcome\n\nThis is a starter post. Publish your first real update from the admin section.",
    tags: ["intro"],
    productArea: "teams",
    status: "published",
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    linkedInPostUrn: null,
  };
  inMemory.posts.set(sample.id, sample);
}

async function listFromCosmos(where: string, parameters: SqlParameter[], orderBy: string) {
  const container = getContainer(POSTS_CONTAINER);
  const query = {
    query: `SELECT * FROM c WHERE c.type = "post" AND c.pk = "post" AND ${where} ${orderBy}`,
    parameters,
  };
  const { resources } = await container.items.query<BlogPost>(query).fetchAll();
  return resources;
}

async function getBySlugFromCosmos(slug: string, requirePublished: boolean) {
  const where = requirePublished ? "c.slug = @slug AND c.status = \"published\"" : "c.slug = @slug";
  const posts = await listFromCosmos(where, [{ name: "@slug", value: slug }], "");
  return posts[0] || null;
}

async function getByIdFromCosmos(id: string) {
  const container = getContainer(POSTS_CONTAINER);
  const { resource } = await container.item(id, "post").read<BlogPost>();
  return resource || null;
}

async function replaceCosmos(post: BlogPost) {
  const container = getContainer(POSTS_CONTAINER);
  const { resource } = await container.item(post.id, "post").replace(post);
  return resource as BlogPost;
}

async function createCosmos(post: BlogPost) {
  const container = getContainer(POSTS_CONTAINER);
  const { resource } = await container.items.create(post);
  return resource as BlogPost;
}

function normalizeTags(tags: string[]): string[] {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function computeSlug(input: { slug?: string; title: string }): string {
  const base = slugify(input.slug || input.title);
  return base || "post";
}

async function ensureSlugUnique(slug: string, excludingId?: string) {
  if (cosmosEnabled()) {
    const posts = await listFromCosmos(
      excludingId ? "c.slug = @slug AND c.id != @id" : "c.slug = @slug",
      excludingId
        ? [
            { name: "@slug", value: slug },
            { name: "@id", value: excludingId },
          ]
        : [{ name: "@slug", value: slug }],
      ""
    );
    return posts.length === 0;
  }

  seedInMemoryOnce();
  for (const post of inMemory.posts.values()) {
    if (post.slug === slug && post.id !== excludingId) return false;
  }
  return true;
}

async function makeUniqueSlug(baseSlug: string, excludingId?: string) {
  let candidate = baseSlug;
  let counter = 2;
  while (!(await ensureSlugUnique(candidate, excludingId))) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function listPublishedPosts(): Promise<BlogPost[]> {
  if (cosmosEnabled()) {
    return listFromCosmos("c.status = \"published\"", [], "ORDER BY c.publishedAt DESC");
  }

  seedInMemoryOnce();
  return Array.from(inMemory.posts.values())
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  if (cosmosEnabled()) {
    return getBySlugFromCosmos(slug, true);
  }

  seedInMemoryOnce();
  for (const post of inMemory.posts.values()) {
    if (post.slug === slug && post.status === "published") return post;
  }
  return null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (cosmosEnabled()) {
    return getBySlugFromCosmos(slug, false);
  }

  seedInMemoryOnce();
  for (const post of inMemory.posts.values()) {
    if (post.slug === slug) return post;
  }
  return null;
}

export async function listAdminPosts(): Promise<BlogPost[]> {
  if (cosmosEnabled()) {
    return listFromCosmos("1=1", [], "ORDER BY c.updatedAt DESC");
  }

  seedInMemoryOnce();
  return Array.from(inMemory.posts.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (cosmosEnabled()) {
    return getByIdFromCosmos(id);
  }

  seedInMemoryOnce();
  return inMemory.posts.get(id) || null;
}

export async function createPost(input: CreatePostInput): Promise<BlogPost> {
  const parsed = createPostInputSchema.parse(input);
  const createdAt = nowIso();
  const baseSlug = computeSlug({ slug: parsed.slug, title: parsed.title });
  const slug = await makeUniqueSlug(baseSlug);

  const post: BlogPost = {
    type: "post",
    pk: "post",
    id: crypto.randomUUID(),
    slug,
    title: parsed.title,
    summary: parsed.summary || "",
    bodyMarkdown: parsed.bodyMarkdown || "",
    tags: normalizeTags(parsed.tags || []),
    productArea: parsed.productArea as ProductArea,
    status: "draft",
    publishedAt: null,
    createdAt,
    updatedAt: createdAt,
    linkedInPostUrn: null,
  };

  if (cosmosEnabled()) {
    return createCosmos(post);
  }

  seedInMemoryOnce();
  inMemory.posts.set(post.id, post);
  return post;
}

export async function updatePost(id: string, patch: UpdatePostInput): Promise<BlogPost> {
  const parsed = updatePostInputSchema.parse(patch);
  const existing = await getPostById(id);
  if (!existing) {
    throw new Error("Post not found");
  }

  const baseSlug = parsed.slug || (parsed.title ? computeSlug({ title: parsed.title }) : null);
  const slug = baseSlug ? await makeUniqueSlug(slugify(baseSlug), id) : existing.slug;

  const updated: BlogPost = {
    ...existing,
    slug,
    title: parsed.title ?? existing.title,
    summary: parsed.summary ?? existing.summary,
    bodyMarkdown: parsed.bodyMarkdown ?? existing.bodyMarkdown,
    tags: parsed.tags ? normalizeTags(parsed.tags) : existing.tags,
    productArea: (parsed.productArea ?? existing.productArea) as ProductArea,
    status: (parsed.status ?? existing.status) as BlogPost["status"],
    updatedAt: nowIso(),
  };

  if (cosmosEnabled()) {
    return replaceCosmos(updated);
  }

  seedInMemoryOnce();
  inMemory.posts.set(updated.id, updated);
  return updated;
}

export async function publishPost(id: string): Promise<BlogPost> {
  const existing = await getPostById(id);
  if (!existing) {
    throw new Error("Post not found");
  }

  const publishedAt = existing.publishedAt || nowIso();
  const updated: BlogPost = {
    ...existing,
    status: "published",
    publishedAt,
    updatedAt: nowIso(),
  };

  if (cosmosEnabled()) {
    return replaceCosmos(updated);
  }

  seedInMemoryOnce();
  inMemory.posts.set(updated.id, updated);
  return updated;
}

export async function setLinkedInPostUrn(id: string, linkedInPostUrn: string): Promise<BlogPost> {
  const existing = await getPostById(id);
  if (!existing) {
    throw new Error("Post not found");
  }

  const updated: BlogPost = {
    ...existing,
    linkedInPostUrn,
    updatedAt: nowIso(),
  };

  if (cosmosEnabled()) {
    return replaceCosmos(updated);
  }

  seedInMemoryOnce();
  inMemory.posts.set(updated.id, updated);
  return updated;
}
