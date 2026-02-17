import { getSiteUrl } from "@/lib/site";
import { listPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(iso: string): string {
  return new Date(iso).toUTCString();
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await listPublishedPosts();

  const lastBuildDate = posts[0]?.publishedAt
    ? toRssDate(posts[0].publishedAt)
    : new Date().toUTCString();

  const items = posts
    .filter((p) => p.slug && p.publishedAt)
    .map((p) => {
      const url = `${siteUrl}/blog/${encodeURIComponent(p.slug)}`;
      const title = escapeXml(p.title || "");
      const summary = escapeXml(p.summary || "");
      const pubDate = escapeXml(toRssDate(p.publishedAt!));

      return [
        "<item>",
        `<title>${title}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink=\"true\">${escapeXml(url)}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${summary}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    "<title>Geiri.is</title>",
    `<link>${escapeXml(siteUrl)}</link>`,
    "<description>Geiri.is blog</description>",
    `<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=600",
    },
  });
}
