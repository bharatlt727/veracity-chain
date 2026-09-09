import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/nexus/primitives";
import { useProfile } from "@/hooks/useProfile";
import { CLEARANCE_LABELS } from "@/lib/nexus";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [
      { title: "Employee directory — NEXUS" },
      {
        name: "description",
        content: "Employee records: department, designation, office, role, clearance level and account status.",
      },
      { property: "og:title", content: "Employee directory — NEXUS" },
      { property: "og:description", content: "Officer records, clearance levels and account status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const { data: me } = useProfile();

  const { data: staff } = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("employee_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: devices } = useQuery({
    queryKey: ["my-devices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("registered_devices")
        .select("id, device_label, last_used_at, created_at");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Organisation</p>
        <h1 className="mt-1 text-2xl font-semibold">Employee directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrators and senior officers see the full directory; everyone else sees their own record.
        </p>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Employee ID", "Name", "Department", "Designation", "Office", "Clearance", "Status"].map(
                  (h) => (
                    <th key={h} className="label-caps py-2 pr-4 font-normal">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(staff ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="mono-id py-2 pr-4 text-xs text-primary">{p.employee_id}</td>
                  <td className="py-2 pr-4">
                    {p.full_name}
                    {me?.id === p.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.department}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.designation}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.office}</td>
                  <td className="mono-id py-2 pr-4 text-xs">
                    {CLEARANCE_LABELS[p.clearance_level] ?? p.clearance_level}
                  </td>
                  <td
                    className={`mono-id py-2 text-xs uppercase ${p.status === "ACTIVE" ? "text-success" : "text-destructive"}`}
                  >
                    {p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Your registered devices" subtitle="Passkeys enrolled for level 2 authentication">
        <ul className="divide-y divide-border text-sm">
          {(devices ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-2">
              <span>{d.device_label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                enrolled {new Date(d.created_at).toLocaleDateString()}
                {d.last_used_at && ` · last used ${new Date(d.last_used_at).toLocaleString()}`}
              </span>
            </li>
          ))}
          {devices?.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">No devices enrolled yet.</li>
          )}
        </ul>
      </Panel>
    </div>
  );
}
