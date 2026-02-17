import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Hi — I’m Geiri.</h1>
      <p className="max-w-2xl text-zinc-700 dark:text-zinc-300">
        This is my personal site with my CV and blog posts about what’s new in
        Microsoft Teams, Intune, and Entra.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/cv"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          View CV
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
        >
          Read blog
        </Link>
      </div>
    </div>
  );
}
