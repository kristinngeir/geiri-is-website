import { NextRequest } from "next/server";

import { publishPost } from "@/lib/posts";
import { requireAdmin } from "@/lib/swa-auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, ctx: Context) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const { id } = await ctx.params;

  try {
    const post = await publishPost(id);

    return Response.json({ post });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Publish failed" },
      { status: 400 }
    );
  }
}
