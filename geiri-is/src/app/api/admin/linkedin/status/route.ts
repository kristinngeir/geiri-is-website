import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/swa-auth";
import { getLinkedInAuthSecret } from "@/lib/secrets";

export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const secret = await getLinkedInAuthSecret();
  if (!secret) {
    return Response.json({ connected: false });
  }

  const expiresAt = secret.expiresAt ?? null;
  if (expiresAt) {
    const ms = new Date(expiresAt).getTime();
    if (!Number.isNaN(ms) && Date.now() > ms) {
      return Response.json({ connected: false });
    }
  }

  return Response.json({ connected: true, expiresAt });
}
