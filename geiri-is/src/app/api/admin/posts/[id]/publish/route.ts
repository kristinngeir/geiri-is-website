import { NextRequest } from "next/server";

import { publishPost, setLinkedInPostUrn } from "@/lib/posts";
import { requireAdmin } from "@/lib/swa-auth";
import { maybePostToLinkedIn } from "@/lib/linkedin";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, ctx: Context) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const { id } = await ctx.params;

  try {
    let post = await publishPost(id);

    if (!post.linkedInPostUrn) {
      const linkedInPostUrn = await maybePostToLinkedIn(post);
      if (linkedInPostUrn) {
        post = await setLinkedInPostUrn(post.id, linkedInPostUrn);
      }
    }

    return Response.json({ post });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Publish failed" },
      { status: 400 }
    );
  }
}
