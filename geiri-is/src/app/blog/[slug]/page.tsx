import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { Markdown } from "@/components/markdown";
import { getPostBySlug, getPublishedPostBySlug } from "@/lib/posts";
import { getSwaClientPrincipalFromHeaders } from "@/lib/swa-auth";

type Props = {
  params: { slug: string };
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = params;
  const principal = getSwaClientPrincipalFromHeaders(await headers());
  const isAdmin = principal?.userRoles?.includes("admin") ?? false;

  const post = isAdmin ? await getPostBySlug(slug) : await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="uppercase tracking-wide">{post.productArea}</span>
          {post.status !== "published" ? (
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
              DRAFT
            </span>
          ) : null}
          {post.publishedAt ? (
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          ) : null}
        </div>
        {post.summary ? (
          <p className="max-w-3xl text-zinc-700 dark:text-zinc-300">
            {post.summary}
          </p>
        ) : null}
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black">
        <Markdown markdown={post.bodyMarkdown} />
      </div>
    </article>
  );
}