import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";

import { ThemeToggle } from "@/components/theme-toggle";
import { getHighestRole, getSwaClientPrincipalFromHeaders } from "@/lib/swa-auth";

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("theme");
    const theme = stored === "light" || stored === "dark" ? stored : null;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = theme ? theme === "dark" : !!prefersDark;
    document.documentElement.classList.toggle("dark", useDark);
  } catch {}
})();
`;

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
  const isAuthenticated = principal?.userRoles?.includes("authenticated") ?? false;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-dvh bg-zinc-50 font-sans antialiased text-zinc-950 dark:bg-black dark:text-zinc-50"
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Geiri.is
            </Link>
            <div className="flex items-center gap-3">
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
              <ThemeToggle />
              {isAuthenticated ? (
                <a
                  href="/.auth/logout?post_logout_redirect_uri=/"
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-white/20 dark:bg-black dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  Logout
                </a>
              ) : null}
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
