import Link from "next/link";

import { LinkedInStatus } from "@/components/linkedin-status";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/posts"
          className="rounded-lg border border-zinc-200 bg-white p-5 hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/5"
        >
          <div className="font-medium">Posts</div>
          <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Add and edit blog posts.
          </div>
        </Link>
        <Link
          href="/admin/stats"
          className="rounded-lg border border-zinc-200 bg-white p-5 hover:bg-zinc-50 dark:border-white/10 dark:bg-black dark:hover:bg-white/5"
        >
          <div className="font-medium">Statistics</div>
          <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Basic traffic stats from Application Insights.
          </div>
        </Link>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black">
        <h2 className="font-medium">LinkedIn</h2>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          Auto-post when you publish a blog post.
        </p>
        <div className="mt-3">
          <LinkedInStatus />
        </div>
      </section>
    </div>
  );
}