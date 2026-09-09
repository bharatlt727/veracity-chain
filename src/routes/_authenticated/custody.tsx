import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/nexus/primitives";
import { shortHash } from "@/lib/nexus";

export const Route = createFileRoute("/_authenticated/custody")({
  head: () => ({
    meta: [
      { title: "Chain of custody — NEXUS" },
      {
        name: "description",
        content: "Append-only custody record: who acted, what they did, when, from which office, why and the outcome.",
      },
      { property: "og:title", content: "Chain of custody — NEXUS" },
      { property: "og:description", content: "Append-only evidence custody and audit record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Custody;
});

function Custody() {
  const { data: events } = useQuery({
    queryKey: ["custody-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custody_events")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Immutable record</p>
        <h1 className="mt-1 text-2xl font-semibold">Chain of custody</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These rows can be added but never edited or removed — by anyone, including administrators.
        </p>
      </div>

      <Panel>
        <ol className="space-y-4">
          {(events ?? []).map((e) => (
            <li key={e.id} className="border-l-2 border-primary/40 pl-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="mono-id text-[0.65rem] uppercase text-primary">{e.action}</span>
                <span
                  className={`mono-id text-[0.65rem] uppercase ${e.outcome === "SUCCESS" ? "text-success" : "text-destructive"}`}
                >
                  {e.outcome}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(e.occurred_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm">{e.reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.actor_name} · {e.office}
                {e.hash_at_event && ` · ${shortHash(e.hash_at_event.replace(/\s/g, ""))}`}
              </p>
            </li>
          ))}
          {events?.length === 0 && (
            <li className="text-sm text-muted-foreground">No custody events recorded yet.</li>
          )}
        </ol>
      </Panel>
    </div>
  );
}
