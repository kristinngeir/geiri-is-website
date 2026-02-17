import { notFound } from "next/navigation";

import { Markdown } from "@/components/markdown";
import { getPublishedPostBySlug } from "@/lib/posts";

type Props = {
  params: { slug: string };
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="uppercase tracking-wide">{post.productArea}</span>
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