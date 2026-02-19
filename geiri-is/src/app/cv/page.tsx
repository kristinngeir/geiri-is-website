export default function CvPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">CV</h1>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black">
        <h2 className="font-medium">Summary</h2>
        <div className="mt-3 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            Geiri is a Solutions Architect based in Reykjavík, Iceland, focused on Microsoft 365
            architecture and operations — especially Intune, Microsoft Teams, and Microsoft Entra ID.
          </p>
          <p>
            Geiri helps organizations improve security posture, governance, and operational excellence
            with cloud-first solutions.
          </p>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Samantekt</p>
            <p className="mt-2">
              Geiri er lausnaarkitekt í Reykjavík með áherslu á Microsoft 365 hönnun og rekstur —
              sérstaklega Intune, Microsoft Teams og Microsoft Entra ID.
            </p>
            <p className="mt-2">
              Geiri styður fyrirtæki við að bæta öryggi, stjórnarhætti og rekstrarhæfni með
              cloud-first lausnum.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black">
        <h2 className="font-medium">Experience</h2>

        <div className="mt-3 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Wise — Solutions Architect &amp; SysCloud Director
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Dec 2025 – Present</p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Wise — Solutions Architect &amp; SysCloud Team Leader
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Apr 2025 – Dec 2025</p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Wise — Solutions Architect &amp; M365 Team Leader
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">May 2024 – Apr 2025</p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Þekking (Iceland) — Microsoft 365 Team Leader</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Mar 2022 – May 2024</p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Þekking (Iceland) — Solutions Architect</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Jun 2021 – May 2024</p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Þekking (Iceland) — System Administrator</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Dec 2013 – Jun 2021</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black">
        <h2 className="font-medium">Focus areas</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Microsoft 365 architecture and operations</li>
          <li>Intune (endpoint management)</li>
          <li>Microsoft Teams (collaboration, telephony, governance)</li>
          <li>Microsoft Entra ID (identity, conditional access, security posture)</li>
          <li>Security with Microsoft Defender (when relevant)</li>
          <li>Cloud-first solutions and operational excellence</li>
        </ul>
      </section>
    </div>
  );
}