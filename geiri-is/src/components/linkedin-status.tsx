"use client";

import { useEffect, useState } from "react";

type StatusResponse =
  | { connected: true; expiresAt?: string | null }
  | { connected: false };

export function LinkedInStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/linkedin/status", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Status request failed: ${res.status}`);
        }
        const json = (await res.json()) as StatusResponse;
        if (!cancelled) setStatus(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!status) {
    return <div className="text-sm text-zinc-600">Loading…</div>;
  }

  if (!status.connected) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          Not connected.
        </div>
        <a
          href="/api/admin/linkedin/connect"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Connect LinkedIn
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-zinc-700 dark:text-zinc-300">
        Connected{status.expiresAt ? ` (expires ${new Date(status.expiresAt).toLocaleDateString()})` : ""}.
      </div>
      <a
        href="/api/admin/linkedin/connect"
        className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/5"
      >
        Re-connect
      </a>
    </div>
  );
}