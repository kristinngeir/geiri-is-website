"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  postId: string;
};

export function PostListDeleteButton({ postId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error || `Delete failed (${res.status})`);
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
    >
      Delete
    </button>
  );
}