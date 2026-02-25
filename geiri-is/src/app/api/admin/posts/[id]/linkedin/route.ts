import { NextRequest } from "next/server";

import { getPostById, setLinkedInPostUrn } from "@/lib/posts";
import { postToLinkedIn } from "@/lib/linkedin";
import { getSiteUrl } from "@/lib/site";
import { requireAdmin } from "@/lib/swa-auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, ctx: Context) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const { id } = await ctx.params;

  try {
    const post = await getPostById(id);
    if (!post) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    if (post.status !== "published") {
      return Response.json({ error: "post_not_published" }, { status: 400 });
    }

    if (post.linkedInPostUrn) {
      return Response.json({ post });
    }

    if (!post.shareToLinkedIn) {
      return Response.json({ error: "linkedin_not_enabled_for_post" }, { status: 400 });
    }

    const linkedInText = (post.linkedInText ?? "").trim();
    if (!linkedInText) {
      return Response.json({ error: "linkedin_text_empty" }, { status: 400 });
    }

    const url = `${getSiteUrl()}/blog/${post.slug}`;
    const linkedInPostUrn = await postToLinkedIn({
      text: linkedInText,
      url,
      title: post.title,
    });

    const updated = await setLinkedInPostUrn(post.id, linkedInPostUrn);
    return Response.json({ post: updated });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "LinkedIn post failed" },
      { status: 400 }
    );
  }
}
