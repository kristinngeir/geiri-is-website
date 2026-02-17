import { NextRequest } from "next/server";

import { createPost, createPostInputSchema, listAdminPosts } from "@/lib/posts";
import { requireAdmin } from "@/lib/swa-auth";

export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const posts = await listAdminPosts();
  return Response.json({ posts });
}

export async function POST(req: NextRequest) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const input = createPostInputSchema.parse(body);
    const post = await createPost(input);
    return Response.json({ post }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 }
    );
  }
}
