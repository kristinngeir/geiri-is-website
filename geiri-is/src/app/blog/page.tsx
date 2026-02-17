import Link from "next/link";

import { listPublishedPosts } from "@/lib/posts";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

function matchesQuery(post: Awaited<ReturnType<typeof listPublishedPosts>>[number], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    post.title,
    post.summary,
    post.slug,
    post.productArea,
    ...(post.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const posts = await listPublishedPosts();
  const resolvedSearchParams = await searchParams;
  const q = (resolvedSearchParams?.q || "").trim();
  const filtered = q ? posts.filter((p) => matchesQuery(p, q)) : posts;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <p className="max-w-2xl text-zinc-700 dark:text-zinc-300">
          Updates and notes about what’s new in Teams, Intune, and Entra.
        </p>
      </div>

      <form action="/blog" method="get" className="flex items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search posts…"
          className="w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
        >
          Search
        </button>
      </form>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-black dark:text-zinc-300">
            {q ? "No matching posts." : "No posts yet."}
          </div>
        ) : (
          filtered.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-medium">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {post.productArea}
                </span>
              </div>
              {post.summary ? (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {post.summary}
                </p>
              ) : null}
              {post.publishedAt ? (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}