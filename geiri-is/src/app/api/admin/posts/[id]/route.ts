import { NextRequest } from "next/server";

import { getPostById, updatePost, updatePostInputSchema } from "@/lib/posts";
import { requireAdmin } from "@/lib/swa-auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, ctx: Context) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  const post = await getPostById(id);
  if (!post) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ post });
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const patch = updatePostInputSchema.parse(body);
    const post = await updatePost(id, patch);
    return Response.json({ post });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 }
    );
  }
}
