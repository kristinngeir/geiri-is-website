import { notFound } from "next/navigation";

import { PostEditor } from "@/components/post-editor";
import { getPostById } from "@/lib/posts";

type Props = {
  params: { id: string };
};

export default async function EditPostPage({ params }: Props) {
  const { id } = params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Edit post</h1>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Status: <span className="font-medium">{post.status}</span>
        </div>
      </div>
      <PostEditor mode="edit" post={post} />
    </div>
  );
}
