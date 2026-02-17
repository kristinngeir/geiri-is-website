import { PostEditor } from "@/components/post-editor";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
      <PostEditor mode="new" />
    </div>
  );
}
