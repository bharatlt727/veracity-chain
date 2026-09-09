import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { ClassificationBadge, Panel } from "@/components/nexus/primitives";
import type { Classification } from "@/lib/nexus";

export const Route = createFileRoute("/_authenticated/cases/")({
  head: () => ({
    meta: [
      { title: "Case register — NEXUS" },
      {
        name: "description",
        content: "Every case you are cleared to see, with classification, status, office and risk score.",
      },
      { property: "og:title", content: "Case register — NEXUS" },
      { property: "og:description", content: "Clearance-filtered register of investigation cases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaseRegister,
});

function CaseRegister() {
  const { data: cases } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("opened_on", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Register</p>
        <h1 className="mt-1 text-2xl font-semibold">Cases</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A case only appears here when your clearance level is at or above its classification.
        </p>
      </div>

      <Panel>
        <div className="grid gap-3">
          {(cases ?? []).map((c) => (
            <Link
              key={c.id}
              to="/cases/$caseId"
              params={{ caseId: c.id }}
              className="rounded-md border border-border bg-surface-2/50 p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="mono-id text-xs text-primary">{c.case_number}</span>
                <ClassificationBadge value={c.classification as Classification} />
                <span className="mono-id text-[0.65rem] uppercase text-muted-foreground">
                  {c.status.replace(/_/g, " ")}
                </span>
                <span className="ml-auto mono-id text-xs text-muted-foreground">
                  Risk {c.risk_score}/100
                </span>
              </div>
              <h2 className="mt-2 text-base font-medium">{c.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.office} · opened {new Date(c.opened_on).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {cases?.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">
              No cases are visible at your clearance level.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
