import { z } from "zod";
import type { SqlParameter } from "@azure/cosmos";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { cosmosEnabled, getContainer } from "@/lib/cosmos";
import type { BlogPost, ProductArea } from "@/lib/types";
import { slugify } from "@/lib/slug";

const POSTS_CONTAINER = process.env.COSMOS_POSTS_CONTAINER_ID || "posts";

const productAreaSchema = z.enum(["teams", "intune", "entra"]);

function isValidHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalHttpUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .default("")
  .refine(isValidHttpUrl, "Invalid URL");

const httpUrlSchema = z.string().trim().max(2000).refine(isValidHttpUrl, "Invalid URL");

export const createPostInputSchema = z.object({
  title: z.string().min(1).max(200),
  titleEn: z.string().max(200).optional().default(""),
  summary: z.string().max(400).optional().default(""),
  bodyMarkdown: z.string().optional().default(""),
  sourceUrl: optionalHttpUrlSchema,
  productArea: productAreaSchema.default("teams"),
  tags: z.array(z.string()).optional().default([]),
  slug: z.string().max(200).optional(),
  shareToLinkedIn: z.boolean().optional().default(false),
  linkedInText: z.string().max(3000).optional().default(""),
});

// NOTE: `createPostInputSchema.partial()` would keep `.default(...)` on many fields,
// which would overwrite existing values during PATCH. Keep the PATCH schema explicit.
export const updatePostInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleEn: z.string().max(200).optional(),
  summary: z.string().max(400).optional(),
  bodyMarkdown: z.string().optional(),
  sourceUrl: httpUrlSchema.optional(),
  productArea: productAreaSchema.optional(),
  tags: z.array(z.string()).optional(),
  slug: z.string().max(200).optional(),
  shareToLinkedIn: z.boolean().optional(),
  linkedInText: z.string().max(3000).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

type CreatePostInput = z.infer<typeof createPostInputSchema>;
type UpdatePostInput = z.infer<typeof updatePostInputSchema>;

const nowIso = () => new Date().toISOString();

const fallbackPostsFilePath =
  process.env.POSTS_FALLBACK_FILE || path.join(tmpdir(), "geiri-is", "posts-fallback.json");

type FallbackPostsFile = {
  posts: BlogPost[];
};

function createSeedPost(): BlogPost {
  const createdAt = nowIso();
  return {
    type: "post",
    pk: "post",
    id: "sample-1",
    slug: "welcome",
    title: "Welcome",
    titleEn: "",
    summary: "First post — wire up Cosmos DB and start publishing.",
    bodyMarkdown:
      "# Welcome\n\nThis is a starter post. Publish your first real update from the admin section.",
    sourceUrl: "",
    tags: ["intro"],
    productArea: "teams",
    status: "published",
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    shareToLinkedIn: false,
    linkedInText: "",
    linkedInPostUrn: null,
  };
}

async function readFallbackPosts(): Promise<Map<string, BlogPost>> {
  try {
    const raw = await readFile(fallbackPostsFilePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<FallbackPostsFile>;
    const posts = new Map<string, BlogPost>();
    for (const post of parsed.posts || []) {
      if (post.type === "post" && post.pk === "post" && post.id) {
        posts.set(post.id, post);
      }
    }
    return posts;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return new Map<string, BlogPost>();
    }
    console.error("[posts] fallback read failed", error);
    return new Map<string, BlogPost>();
  }
}

async function writeFallbackPosts(posts: Map<string, BlogPost>): Promise<void> {
  const dir = path.dirname(fallbackPostsFilePath);
  await mkdir(dir, { recursive: true });
  const tempPath = `${fallbackPostsFilePath}.${crypto.randomUUID()}.tmp`;
  const payload: FallbackPostsFile = { posts: Array.from(posts.values()) };
  await writeFile(tempPath, JSON.stringify(payload, null, 2), "utf8");
  await rename(tempPath, fallbackPostsFilePath);
}

async function getFallbackPosts(): Promise<Map<string, BlogPost>> {
  const posts = await readFallbackPosts();
  if (posts.size > 0) return posts;

  const sample = createSeedPost();
  posts.set(sample.id, sample);
  await writeFallbackPosts(posts);
  return posts;
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 404
  );
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

  const posts = await getFallbackPosts();
  for (const post of posts.values()) {
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
    try {
      return await listFromCosmos(
        'c.status = "published"',
        [],
        "ORDER BY c.publishedAt DESC"
      );
    } catch (err) {
      console.error("[posts] listPublishedPosts Cosmos query failed", err);
      return [];
    }
  }

  const posts = await getFallbackPosts();
  return Array.from(posts.values())
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  if (cosmosEnabled()) {
    try {
      return await getBySlugFromCosmos(slug, true);
    } catch (err) {
      console.error("[posts] getPublishedPostBySlug Cosmos query failed", err);
      return null;
    }
  }

  const posts = await getFallbackPosts();
  for (const post of posts.values()) {
    if (post.slug === slug && post.status === "published") return post;
  }
  return null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (cosmosEnabled()) {
    try {
      return await getBySlugFromCosmos(slug, false);
    } catch (err) {
      console.error("[posts] getPostBySlug Cosmos query failed", err);
      return null;
    }
  }

  const posts = await getFallbackPosts();
  for (const post of posts.values()) {
    if (post.slug === slug) return post;
  }
  return null;
}

export async function listAdminPosts(): Promise<BlogPost[]> {
  if (cosmosEnabled()) {
    try {
      return await listFromCosmos("1=1", [], "ORDER BY c.updatedAt DESC");
    } catch (err) {
      console.error("[posts] listAdminPosts Cosmos query failed", err);
      return [];
    }
  }

  const posts = await getFallbackPosts();
  return Array.from(posts.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (cosmosEnabled()) {
    try {
      return await getByIdFromCosmos(id);
    } catch (err) {
      console.error("[posts] getPostById Cosmos read failed", err);
      return null;
    }
  }

  const posts = await getFallbackPosts();
  return posts.get(id) || null;
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
    titleEn: parsed.titleEn || "",
    summary: parsed.summary || "",
    bodyMarkdown: parsed.bodyMarkdown || "",
    sourceUrl: parsed.sourceUrl || "",
    tags: normalizeTags(parsed.tags || []),
    productArea: parsed.productArea as ProductArea,
    status: "draft",
    publishedAt: null,
    createdAt,
    updatedAt: createdAt,
    shareToLinkedIn: Boolean(parsed.shareToLinkedIn),
    linkedInText: parsed.linkedInText || "",
    linkedInPostUrn: null,
  };

  if (cosmosEnabled()) {
    return createCosmos(post);
  }

  const posts = await getFallbackPosts();
  posts.set(post.id, post);
  await writeFallbackPosts(posts);
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
    titleEn: parsed.titleEn ?? existing.titleEn ?? "",
    summary: parsed.summary ?? existing.summary,
    bodyMarkdown: parsed.bodyMarkdown ?? existing.bodyMarkdown,
    sourceUrl: parsed.sourceUrl ?? existing.sourceUrl ?? "",
    tags: parsed.tags ? normalizeTags(parsed.tags) : existing.tags,
    productArea: (parsed.productArea ?? existing.productArea) as ProductArea,
    status: (parsed.status ?? existing.status) as BlogPost["status"],
    shareToLinkedIn: parsed.shareToLinkedIn ?? existing.shareToLinkedIn ?? false,
    linkedInText: parsed.linkedInText ?? existing.linkedInText ?? "",
    updatedAt: nowIso(),
  };

  if (cosmosEnabled()) {
    return replaceCosmos(updated);
  }

  const posts = await getFallbackPosts();
  posts.set(updated.id, updated);
  await writeFallbackPosts(posts);
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

  const posts = await getFallbackPosts();
  posts.set(updated.id, updated);
  await writeFallbackPosts(posts);
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

  const posts = await getFallbackPosts();
  posts.set(updated.id, updated);
  await writeFallbackPosts(posts);
  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  if (cosmosEnabled()) {
    try {
      const container = getContainer(POSTS_CONTAINER);
      await container.item(id, "post").delete();
      return true;
    } catch (err) {
      if (isNotFoundError(err)) return false;
      throw err;
    }
  }

  const posts = await getFallbackPosts();
  const deleted = posts.delete(id);
  if (!deleted) return false;

  await writeFallbackPosts(posts);
  return true;
}
