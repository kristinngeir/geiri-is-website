import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/swa-auth";

async function queryAppInsights(query: string) {
  const appId = process.env.APPINSIGHTS_APP_ID;
  const apiKey = process.env.APPINSIGHTS_API_KEY;
  if (!appId || !apiKey) {
    return null;
  }

  const url = `https://api.applicationinsights.io/v1/apps/${encodeURIComponent(appId)}/query?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`App Insights query failed (${res.status}): ${text}`);
  }
  return (await res.json()) as unknown;
}

function firstTableRows(ai: unknown): unknown[][] {
  if (!ai || typeof ai !== "object") return [];
  const tables = (ai as { tables?: unknown }).tables;
  if (!Array.isArray(tables) || tables.length === 0) return [];

  const firstTable = tables[0] as { rows?: unknown };
  const rows = firstTable?.rows;
  if (!Array.isArray(rows)) return [];

  return rows.filter((r): r is unknown[] => Array.isArray(r));
}

function firstNumberCell(ai: unknown): number | null {
  const rows = firstTableRows(ai);
  const value = rows[0]?.[0];

  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function toTopPages(ai: unknown): { name: string; count: number }[] {
  const rows = firstTableRows(ai);
  return rows
    .map((row) => {
      const name = String(row[0] ?? "");
      const count = Number(row[1]);
      return { name, count };
    })
    .filter((x) => x.name && Number.isFinite(x.count));
}

export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req);
  if (forbidden) return forbidden;

  if (!process.env.APPINSIGHTS_APP_ID || !process.env.APPINSIGHTS_API_KEY) {
    return Response.json({ enabled: false, totalRequests: 0, topPages: [] });
  }

  try {
    const total = await queryAppInsights("requests | summarize count()");
    const top = await queryAppInsights(
      "requests | summarize count=count() by name | top 10 by count desc"
    );

    return Response.json({
      enabled: true,
      totalRequests: firstNumberCell(total) ?? 0,
      topPages: toTopPages(top),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Stats query failed" },
      { status: 500 }
    );
  }
}
