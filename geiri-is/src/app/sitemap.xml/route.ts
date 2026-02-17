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

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = await listPublishedPosts();

  const staticUrls = ["/", "/cv", "/blog"].map((path) => `${siteUrl}${path}`);

  const urlEntries = [
    ...staticUrls.map((u) => `<url><loc>${escapeXml(u)}</loc></url>`),
    ...posts
      .filter((p) => p.slug && p.publishedAt)
      .map((p) => {
        const loc = `${siteUrl}/blog/${encodeURIComponent(p.slug)}`;
        const lastmod = new Date(p.updatedAt || p.publishedAt!).toISOString();
        return `<url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`;
      }),
  ].join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    "</urlset>",
  ].join("");

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=600",
    },
  });
}
