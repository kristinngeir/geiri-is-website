import Link from "next/link";

import { listAdminPosts } from "@/lib/posts";

export default async function AdminPostsPage() {
  const posts = await listAdminPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          New post
        </Link>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-black dark:text-zinc-300">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">{post.title}</div>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                    {post.status}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {post.productArea}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  /blog/{post.slug}
                  {post.linkedInPostUrn ? " • posted to LinkedIn" : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
                >
                  Edit
                </Link>
                {post.status === "published" ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
                  >
                    View
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
