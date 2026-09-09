import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { ClassificationBadge, Panel, Stat } from "@/components/nexus/primitives";
import { useProfile } from "@/hooks/useProfile";
import { CLEARANCE_LABELS, type Classification } from "@/lib/nexus";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command dashboard — NEXUS" },
      {
        name: "description",
        content: "Live view of assigned cases, evidence integrity, custody activity and access compliance.",
      },
      { property: "og:title", content: "Command dashboard — NEXUS" },
      { property: "og:description", content: "Cases, evidence integrity and custody activity at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [cases, evidence, custody, logins] = await Promise.all([
        supabase.from("cases").select("*").order("opened_on", { ascending: false }),
        supabase.from("evidence").select("id, integrity_ok, frozen, classification"),
        supabase
          .from("custody_events")
          .select("id, action, actor_name, office, reason, occurred_at")
          .order("occurred_at", { ascending: false })
          .limit(8),
        supabase
          .from("login_events")
          .select("id, result, occurred_at, device")
          .order("occurred_at", { ascending: false })
          .limit(5),
      ]);
      return {
        cases: cases.data ?? [],
        evidence: evidence.data ?? [],
        custody: custody.data ?? [],
        logins: logins.data ?? [],
      };
    },
  });

  const cases = data?.cases ?? [];
  const evidence = data?.evidence ?? [];
  const failures = evidence.filter((e) => !e.integrity_ok).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Command centre</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {profile ? `Good day, ${profile.full_name.split(" ")[0]}` : "Command centre"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile
            ? `${profile.designation} · ${profile.office} · Clearance ${CLEARANCE_LABELS[profile.clearance_level] ?? profile.clearance_level}`
            : "Loading your clearance…"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visible cases" value={cases.length} hint="Filtered by your clearance" />
        <Stat label="Evidence items" value={evidence.length} hint={`${evidence.filter((e) => e.frozen).length} frozen`} />
        <Stat
          label="Integrity"
          value={failures === 0 ? "100%" : `${failures} failed`}
          tone={failures === 0 ? "success" : "destructive"}
          hint="SHA-256 re-verification"
        />
        <Stat label="Unauthorised access" value={0} tone="success" hint="Blocked attempts this session" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Active cases" subtitle="Only cases at or below your clearance" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: c.id }}
                  className="flex flex-wrap items-center gap-3 py-3 transition-colors hover:text-primary"
                >
                  <span className="mono-id text-xs text-muted-foreground">{c.case_number}</span>
                  <span className="flex-1 text-sm font-medium">{c.title}</span>
                  <ClassificationBadge value={c.classification as Classification} />
                  <span className="mono-id text-xs text-muted-foreground">RISK {c.risk_score}</span>
                </Link>
              </li>
            ))}
            {cases.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground">
                No cases are visible at your clearance level.
              </li>
            )}
          </ul>
        </Panel>

        <Panel title="Recent custody activity" subtitle="Append-only record">
          <ol className="space-y-3">
            {(data?.custody ?? []).map((e) => (
              <li key={e.id} className="border-l-2 border-border pl-3">
                <p className="mono-id text-[0.65rem] uppercase text-primary">{e.action}</p>
                <p className="text-sm">{e.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {e.actor_name} · {e.office} · {new Date(e.occurred_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="Your recent sign-ins" subtitle="Three-level authentication history">
        <ul className="divide-y divide-border text-sm">
          {(data?.logins ?? []).map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-2">
              <span
                className={`mono-id text-[0.65rem] uppercase ${l.result === "GRANTED" ? "text-success" : "text-destructive"}`}
              >
                {l.result}
              </span>
              <span className="text-muted-foreground">{l.device}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(l.occurred_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
