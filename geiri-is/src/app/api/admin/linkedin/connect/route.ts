import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/swa-auth";
import { buildLinkedInAuthUrl } from "@/lib/linkedin";

export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const state = crypto.randomUUID();
  const authUrl = buildLinkedInAuthUrl(state);

  const res = Response.redirect(authUrl);
  const isSecure = new URL(req.url).protocol === "https:";
  res.headers.append(
    "set-cookie",
    `li_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}`
  );
  return res;
}
