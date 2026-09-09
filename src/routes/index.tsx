import { createFileRoute, Link } from "@tanstack/react-router";
import { Fingerprint, GitBranch, Lock, ScanEye, ShieldCheck, Workflow } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS — Secure Digital Evidence & Legal Intelligence Platform" },
      {
        name: "description",
        content:
          "Zero-Trust evidence platform: three-level authentication, clearance-based access, SHA-256 verifiable custody and approval-gated modification.",
      },
      { property: "og:title", content: "NEXUS — Secure Digital Evidence Platform" },
      {
        property: "og:description",
        content:
          "Every document authenticated, permission-controlled, traceable across offices and cryptographically verifiable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  {
    icon: Lock,
    title: "Three-level authentication",
    body: "One-time code, then a device passkey, then employee ID and password — every session, every officer.",
  },
  {
    icon: ScanEye,
    title: "Clearance-gated access",
    body: "Each document carries a classification checked against the viewer's clearance before it ever opens.",
  },
  {
    icon: Fingerprint,
    title: "Cryptographic integrity",
    body: "A SHA-256 fingerprint is taken at upload and re-checked on every open. Any mismatch is raised immediately.",
  },
  {
    icon: GitBranch,
    title: "Chain of custody",
    body: "Who, what, when, which office, why and the outcome — recorded for every action and never editable.",
  },
  {
    icon: Workflow,
    title: "Approval-gated change",
    body: "Officers view, download and comment. Modification always waits for a senior officer's verified approval.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence freeze",
    body: "Critical evidence can be frozen so it cannot be altered, overwritten or removed while the case runs.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-vault">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <span className="font-display text-xl font-semibold">NEXUS</span>
        </div>
        <Link
          to="/auth"
          className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Officer sign in
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <p className="label-caps">Zero Trust · RBAC + ABAC · Verifiable evidence</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
          Secure Digital Evidence &amp; Legal Intelligence Platform
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Every document authenticated, permission-controlled, traceable across offices,
          cryptographically verifiable and AI-searchable — with no modification possible
          without authorised approval.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-signal px-5 py-2.5 font-semibold text-primary-foreground shadow-glow"
          >
            Enter the vault
          </Link>
          <a
            href="#capabilities"
            className="rounded-md border border-border px-5 py-2.5 font-medium text-foreground hover:bg-surface-2"
          >
            What it protects
          </a>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <article key={p.title} className="panel p-5">
              <p.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
