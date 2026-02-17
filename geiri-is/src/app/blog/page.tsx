import Link from "next/link";

import { listPublishedPosts } from "@/lib/posts";

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <p className="max-w-2xl text-zinc-700 dark:text-zinc-300">
          Updates and notes about what’s new in Teams, Intune, and Entra.
        </p>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-black dark:text-zinc-300">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => (
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