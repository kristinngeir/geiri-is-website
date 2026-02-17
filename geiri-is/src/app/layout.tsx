import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import "./globals.css";

import { getHighestRole, getSwaClientPrincipalFromHeaders } from "@/lib/swa-auth";

export const metadata: Metadata = {
  title: "Geiri.is",
  description: "CV and blog posts about what’s new in Teams, Intune, and Entra.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const principal = getSwaClientPrincipalFromHeaders(await headers());
  const highestRole = getHighestRole(principal?.userRoles);

  return (
    <html lang="en">
      <body
        className="min-h-dvh bg-zinc-50 font-sans antialiased text-zinc-950 dark:bg-black dark:text-zinc-50"
      >
        <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Geiri.is
            </Link>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-4 text-sm text-zinc-700 dark:text-zinc-200">
                <Link href="/cv" className="hover:underline">
                  CV
                </Link>
                <Link href="/blog" className="hover:underline">
                  Blog
                </Link>
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              </nav>
              {principal?.userDetails && highestRole ? (
                <span className="max-w-56 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {principal.userDetails} ({highestRole})
                </span>
              ) : null}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
