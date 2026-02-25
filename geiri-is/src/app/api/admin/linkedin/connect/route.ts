import { NextRequest } from "next/server";
import { randomUUID as nodeRandomUUID } from "crypto";

import { requireAdmin } from "@/lib/swa-auth";
import { buildLinkedInAuthUrl } from "@/lib/linkedin";

function getExternalBaseUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const proto = (req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")).trim();
  const host =
    (req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host).trim();
  return `${proto}://${host}`;
}

function isSecureRequest(req: NextRequest): boolean {
  const proto = (req.headers.get("x-forwarded-proto") || "").toLowerCase();
  if (proto) return proto === "https";
  return new URL(req.url).protocol === "https:";
}

function randomState(): string {
  return globalThis.crypto?.randomUUID?.() ?? nodeRandomUUID();
}

export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  try {
    const baseUrl = getExternalBaseUrl(req);
    const redirectUri = `${baseUrl}/api/admin/linkedin/callback`;
    const state = randomState();
    const authUrl = buildLinkedInAuthUrl(state, redirectUri);

    const res = Response.redirect(authUrl);
    const isSecure = isSecureRequest(req);

    res.headers.append(
      "set-cookie",
      `li_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}`
    );
    res.headers.append(
      "set-cookie",
      `li_oauth_redirect=${encodeURIComponent(redirectUri)}; Path=/; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}`
    );

    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "LinkedIn connect failed";
    const status = message.includes("Missing required env var") ? 503 : 500;
    return Response.json(
      {
        error: message,
        hint:
          status === 503
            ? "Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in environment variables (and in Azure Static Web Apps application settings)."
            : undefined,
      },
      { status }
    );
  }
}
