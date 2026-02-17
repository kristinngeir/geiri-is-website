import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/swa-auth";
import { completeLinkedInOAuth } from "@/lib/linkedin";

function getCookie(req: NextRequest, name: string) {
  const raw = req.headers.get("cookie") || "";
  const match = raw
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = getCookie(req, "li_oauth_state");

  if (!code || !state || !cookieState || cookieState !== state) {
    return Response.redirect(new URL("/admin?linkedin=error", req.url));
  }

  try {
    await completeLinkedInOAuth(code);
    const res = Response.redirect(new URL("/admin?linkedin=connected", req.url));
    const isSecure = new URL(req.url).protocol === "https:";
    res.headers.append(
      "set-cookie",
      `li_oauth_state=; Path=/; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}; Max-Age=0`
    );
    return res;
  } catch {
    return Response.redirect(new URL("/admin?linkedin=error", req.url));
  }
}
