import { NextRequest } from "next/server";

export type SwaClientPrincipal = {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
};

type HeaderBag = {
  get(name: string): string | null;
};

function decodeSwaClientPrincipal(encoded: string): SwaClientPrincipal | null {
  try {
    const decodedJson = Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(decodedJson) as SwaClientPrincipal;
  } catch {
    return null;
  }
}

export function getSwaClientPrincipalFromHeaders(headers: HeaderBag): SwaClientPrincipal | null {
  const encoded = headers.get("x-ms-client-principal");
  if (!encoded) return null;
  return decodeSwaClientPrincipal(encoded);
}

export function getHighestRole(userRoles: string[] | null | undefined): "admin" | "authenticated" | null {
  if (!userRoles || userRoles.length === 0) return null;
  if (userRoles.includes("admin")) return "admin";
  if (userRoles.includes("authenticated")) return "authenticated";
  return null;
}

export function getSwaClientPrincipal(req: NextRequest): SwaClientPrincipal | null {
  return getSwaClientPrincipalFromHeaders(req.headers);
}

export function isAdminRequest(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const principal = getSwaClientPrincipal(req);
  if (!principal) return false;
  return principal.userRoles?.includes("admin") ?? false;
}

export function requireAdmin(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}
