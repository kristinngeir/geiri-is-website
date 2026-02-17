import type { BlogPost, LinkedInAuthSecret } from "@/lib/types";
import { getLinkedInAuthSecret, setLinkedInAuthSecret } from "@/lib/secrets";
import { getSiteUrl } from "@/lib/site";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function linkedinEnabled() {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

function getRedirectUri() {
  const configured = process.env.LINKEDIN_REDIRECT_URI;
  if (configured) return configured;
  return `${getSiteUrl()}/api/admin/linkedin/callback`;
}

export function buildLinkedInAuthUrl(state: string) {
  const redirectUri = getRedirectUri();
  const clientId = requireEnv("LINKEDIN_CLIENT_ID");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "r_liteprofile w_member_social",
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

async function exchangeCodeForAccessToken(code: string) {
  const redirectUri = getRedirectUri();
  const clientId = requireEnv("LINKEDIN_CLIENT_ID");
  const clientSecret = requireEnv("LINKEDIN_CLIENT_SECRET");

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  const expiresAt = json.expires_in
    ? new Date(Date.now() + json.expires_in * 1000).toISOString()
    : null;

  return { accessToken: json.access_token, expiresAt };
}

async function fetchLinkedInMemberId(accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/me", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn profile lookup failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { id?: string };
  if (!json.id) {
    throw new Error("LinkedIn profile lookup did not return an id.");
  }
  return json.id;
}

export async function completeLinkedInOAuth(code: string): Promise<void> {
  if (!linkedinEnabled()) {
    throw new Error("LinkedIn is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.");
  }

  const { accessToken, expiresAt } = await exchangeCodeForAccessToken(code);
  const memberId = await fetchLinkedInMemberId(accessToken);
  const now = new Date().toISOString();

  const secret: LinkedInAuthSecret = {
    type: "linkedinAuth",
    pk: "secret",
    id: "linkedinAuth",
    accessToken,
    expiresAt,
    memberId,
    createdAt: now,
    updatedAt: now,
  };

  await setLinkedInAuthSecret(secret);
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return Date.now() > new Date(expiresAt).getTime();
}

function hashtagsForProductArea(productArea: BlogPost["productArea"]) {
  switch (productArea) {
    case "teams":
      return ["#MicrosoftTeams", "#M365"];
    case "intune":
      return ["#MicrosoftIntune", "#EndpointManagement"];
    case "entra":
      return ["#MicrosoftEntra", "#Identity"];
  }
}

async function createLinkedInUgcPost(input: {
  accessToken: string;
  memberId: string;
  text: string;
  url: string;
  title: string;
}): Promise<string> {
  const body = {
    author: `urn:li:person:${input.memberId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: input.text },
        shareMediaCategory: "ARTICLE",
        media: [
          {
            status: "READY",
            originalUrl: input.url,
            title: { text: input.title },
          },
        ],
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
      "x-restli-protocol-version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn post failed (${res.status}): ${text}`);
  }

  const headerId = res.headers.get("x-restli-id");
  if (headerId) return headerId;

  const json = (await res.json().catch(() => null)) as { id?: string } | null;
  if (json?.id) return json.id;

  return "unknown";
}

export async function maybePostToLinkedIn(post: BlogPost): Promise<string | null> {
  if (process.env.LINKEDIN_AUTO_POST === "false") {
    return null;
  }

  const secret = await getLinkedInAuthSecret();
  if (!secret) return null;
  if (isExpired(secret.expiresAt)) return null;

  const url = `${getSiteUrl()}/blog/${post.slug}`;
  const tags = hashtagsForProductArea(post.productArea).join(" ");
  const text = `${post.title}\n\n${url}\n\n${tags}`.trim();

  return createLinkedInUgcPost({
    accessToken: secret.accessToken,
    memberId: secret.memberId,
    text,
    url,
    title: post.title,
  });
}
