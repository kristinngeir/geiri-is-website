"use client";

import { useEffect, useState } from "react";

type Stats = {
  enabled: boolean;
  totalRequests: number;
  topPages: { name: string; count: number }[];
  error?: string;
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const json = (await res.json()) as Stats;
      if (!cancelled) setStats(json);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>

      {!stats ? (
        <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
      ) : stats.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-black dark:text-red-200">
          {stats.error}
        </div>
      ) : !stats.enabled ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-black dark:text-zinc-300">
          Stats are not configured yet. Set APPINSIGHTS_APP_ID and APPINSIGHTS_API_KEY.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Total requests</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {stats.totalRequests.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black">
            <div className="font-medium">Top pages</div>
            <div className="mt-3 divide-y divide-zinc-100 text-sm dark:divide-white/10">
              {stats.topPages.length === 0 ? (
                <div className="py-2 text-zinc-600 dark:text-zinc-300">No data yet.</div>
              ) : (
                stats.topPages.map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-4 py-2">
                    <div className="truncate text-zinc-700 dark:text-zinc-200">{p.name}</div>
                    <div className="tabular-nums text-zinc-500 dark:text-zinc-400">
                      {p.count.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
