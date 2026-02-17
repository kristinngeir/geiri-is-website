export default function CvPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">CV</h1>
      <p className="max-w-2xl text-zinc-700 dark:text-zinc-300">
        This page is intentionally minimal to start. Add your profile, roles,
        certifications, and key projects here.
      </p>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black">
        <h2 className="font-medium">Highlights</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Microsoft 365 (Teams) adoption and governance</li>
          <li>Endpoint management (Intune)</li>
          <li>Identity and access (Entra ID)</li>
        </ul>
      </section>
    </div>
  );
}