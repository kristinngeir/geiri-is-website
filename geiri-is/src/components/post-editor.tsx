"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Markdown } from "@/components/markdown";
import type { BlogPost, ProductArea } from "@/lib/types";

type Props =
  | {
      mode: "new";
      post?: never;
    }
  | {
      mode: "edit";
      post: BlogPost;
    };

type SavePayload = {
  title: string;
  titleEn?: string;
  slug?: string;
  summary: string;
  bodyMarkdown: string;
  sourceUrl?: string;
  productArea: ProductArea;
  tags: string[];
  shareToLinkedIn?: boolean;
  linkedInText?: string;
};

function parseTags(input: string) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function PostEditor(props: Props) {
  const router = useRouter();

  const initial = useMemo(() => {
    if (props.mode === "edit") return props.post;
    return null;
  }, [props]);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [bodyMarkdown, setBodyMarkdown] = useState(initial?.bodyMarkdown ?? "");
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? "");
  const [productArea, setProductArea] = useState<ProductArea>(initial?.productArea ?? "teams");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [shareToLinkedIn, setShareToLinkedIn] = useState(Boolean(initial?.shareToLinkedIn));
  const [linkedInText, setLinkedInText] = useState(initial?.linkedInText ?? "");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canPublish = props.mode === "edit";
  const previewSlug = (slug.trim() || (props.mode === "edit" ? props.post.slug : "")).trim();

  async function save() {
    setMessage(null);
    setBusy(true);
    try {
      const payload: SavePayload = {
        title,
        titleEn: titleEn.trim() || undefined,
        slug: slug.trim() || undefined,
        summary,
        bodyMarkdown,
        sourceUrl: sourceUrl.trim() || undefined,
        productArea,
        tags: parseTags(tagsText),
        shareToLinkedIn,
        linkedInText,
      };

      if (props.mode === "new") {
        const res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { post?: BlogPost; error?: string };
        if (!res.ok || !json.post) {
          throw new Error(json.error || `Create failed (${res.status})`);
        }
        router.replace(`/admin/posts/${json.post.id}`);
        router.refresh();
        setMessage("Created.");
      } else {
        const res = await fetch(`/api/admin/posts/${props.post.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { post?: BlogPost; error?: string };
        if (!res.ok || !json.post) {
          throw new Error(json.error || `Save failed (${res.status})`);
        }
        router.refresh();
        setMessage("Saved.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (props.mode !== "edit") return;
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${props.post.id}/publish`, {
        method: "POST",
      });
      const json = (await res.json()) as { post?: BlogPost; error?: string };
      if (!res.ok || !json.post) {
        throw new Error(json.error || `Publish failed (${res.status})`);
      }
      router.refresh();
      setMessage("Published.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function postToLinkedIn() {
    if (props.mode !== "edit") return;
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${props.post.id}/linkedin`, {
        method: "POST",
      });
      const json = (await res.json()) as { post?: BlogPost; error?: string };
      if (!res.ok || !json.post) {
        throw new Error(json.error || `LinkedIn post failed (${res.status})`);
      }
      router.refresh();
      setMessage("Posted to LinkedIn.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function removePost() {
    if (props.mode !== "edit") return;
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${props.post.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Delete failed (${res.status})`);
      }
      router.replace("/admin/posts");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm font-medium">Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">Title (English)</div>
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">Slug (optional)</div>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">Source URL (optional)</div>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <div className="text-sm font-medium">Summary</div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">Product area</div>
          <select
            value={productArea}
            onChange={(e) => setProductArea(e.target.value as ProductArea)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          >
            <option value="teams">Teams</option>
            <option value="intune">Intune</option>
            <option value="entra">Entra</option>
          </select>
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">Tags (comma separated)</div>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={shareToLinkedIn}
            onChange={(e) => setShareToLinkedIn(e.target.checked)}
            className="h-4 w-4"
          />
          <div className="text-sm font-medium">Share to LinkedIn (opt-in)</div>
        </label>
        <label className="space-y-1 sm:col-span-2">
          <div className="text-sm font-medium">LinkedIn post text</div>
          <textarea
            value={linkedInText}
            onChange={(e) => setLinkedInText(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm font-medium">Body (Markdown)</div>
          <textarea
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            rows={16}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-black"
          />
        </label>
        <div className="space-y-1">
          <div className="text-sm font-medium">Preview</div>
          <div className="h-[26.5rem] overflow-auto rounded-md border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-black">
            <Markdown markdown={bodyMarkdown || "_Nothing yet._"} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {busy ? "Working…" : "Save"}
        </button>
        {props.mode === "edit" && previewSlug ? (
          <a
            href={`/blog/${encodeURIComponent(previewSlug)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
          >
            Preview
          </a>
        ) : null}
        {canPublish ? (
          <button
            type="button"
            disabled={busy}
            onClick={publish}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
          >
            Publish
          </button>
        ) : null}
        {props.mode === "edit" ? (
          <button
            type="button"
            disabled={
              busy ||
              props.post.status !== "published" ||
              !shareToLinkedIn ||
              !linkedInText.trim() ||
              Boolean(props.post.linkedInPostUrn)
            }
            onClick={postToLinkedIn}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
          >
            {props.post.linkedInPostUrn ? "Posted to LinkedIn" : "Post to LinkedIn"}
          </button>
        ) : null}
        {props.mode === "edit" ? (
          <button
            type="button"
            disabled={busy}
            onClick={removePost}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
          >
            Delete
          </button>
        ) : null}
        {message ? (
          <div className="text-sm text-zinc-700 dark:text-zinc-300">{message}</div>
        ) : null}
      </div>
    </div>
  );
}
