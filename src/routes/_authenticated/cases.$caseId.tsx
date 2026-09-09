import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Lock, Snowflake, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ClassificationBadge, HashChip, Panel } from "@/components/nexus/primitives";
import { useProfile } from "@/hooks/useProfile";
import {
  CLASSIFICATIONS,
  classificationLabel,
  classificationLevel,
  sha256OfFile,
  type Classification,
} from "@/lib/nexus";

export const Route = createFileRoute("/_authenticated/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case file — NEXUS" },
      {
        name: "description",
        content:
          "Case overview, evidence vault with SHA-256 fingerprints, investigation timeline and chain of custody.",
      },
      { property: "og:title", content: "Case file — NEXUS" },
      { property: "og:description", content: "Evidence vault, timeline and custody record for a single case." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { caseId } = Route.useParams();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [classification, setClassification] = useState<Classification>("CONFIDENTIAL");
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const [kase, evidence, timeline, custody] = await Promise.all([
        supabase.from("cases").select("*").eq("id", caseId).maybeSingle(),
        supabase.from("evidence").select("*").eq("case_id", caseId).order("evidence_number"),
        supabase.from("case_timeline").select("*").eq("case_id", caseId).order("occurred_on"),
        supabase
          .from("custody_events")
          .select("*")
          .eq("case_id", caseId)
          .order("occurred_at", { ascending: false })
          .limit(30),
      ]);
      return {
        kase: kase.data,
        evidence: evidence.data ?? [],
        timeline: timeline.data ?? [],
        custody: custody.data ?? [],
      };
    },
  });

  async function uploadEvidence() {
    if (!file || !title.trim() || !profile) {
      toast.error("Choose a file and give the evidence a title.");
      return;
    }
    if (profile.clearance_level < classificationLevel(classification)) {
      toast.error("Your clearance is below the classification you selected.");
      return;
    }
    setUploading(true);
    try {
      const hash = await sha256OfFile(file);
      const number = `EVID-${String((data?.evidence.length ?? 0) + 1).padStart(2, "0")}`;
      const path = `${caseId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: inserted, error } = await supabase
        .from("evidence")
        .insert({
          case_id: caseId,
          evidence_number: number,
          title: title.trim(),
          classification,
          sha256: hash,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: profile.id,
          uploaded_office: profile.office,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("custody_events").insert({
        case_id: caseId,
        evidence_id: inserted.id,
        actor_id: profile.id,
        actor_name: profile.full_name,
        action: "UPLOADED",
        office: profile.office,
        reason: "Evidence lodged in the secure vault",
        outcome: "SUCCESS",
        hash_at_event: hash,
      });

      toast.success(`${number} lodged · fingerprint recorded`);
      setTitle("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function openEvidence(item: { id: string; file_path: string | null; sha256: string }) {
    if (!profile) return;
    await supabase.from("custody_events").insert({
      case_id: caseId,
      evidence_id: item.id,
      actor_id: profile.id,
      actor_name: profile.full_name,
      action: "VIEWED",
      office: profile.office,
      reason: "Opened from the case file",
      outcome: "SUCCESS",
      hash_at_event: item.sha256,
    });
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });

    if (!item.file_path) {
      toast.message("Demonstration record — no stored file attached.");
      return;
    }
    const { data: signed, error } = await supabase.storage
      .from("evidence")
      .createSignedUrl(item.file_path, 60);
    if (error || !signed) {
      toast.error("Access link could not be issued.");
      return;
    }
    window.open(signed.signedUrl, "_blank", "noopener");
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Opening case file…
      </div>
    );
  }

  const kase = data?.kase;
  if (!kase) {
    return (
      <Panel>
        <p className="flex items-center gap-2 text-sm">
          <Lock className="size-4 text-destructive" />
          This case is not available at your clearance level.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/cases" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Case register
      </Link>

      <div className="panel p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="mono-id text-sm text-primary">{kase.case_number}</span>
          <ClassificationBadge value={kase.classification as Classification} />
          <span className="mono-id text-[0.65rem] uppercase text-muted-foreground">
            {kase.status.replace(/_/g, " ")}
          </span>
          <span className="ml-auto mono-id text-xs text-muted-foreground">
            Risk {kase.risk_score}/100
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">{kase.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{kase.summary}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {kase.office} · opened {new Date(kase.opened_on).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Evidence vault" subtitle="Each item carries a SHA-256 fingerprint checked on every open">
            <ul className="space-y-3">
              {data?.evidence.map((item) => (
                <li key={item.id} className="rounded-md border border-border bg-surface-2/50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="mono-id text-xs text-primary">{item.evidence_number}</span>
                    <ClassificationBadge value={item.classification as Classification} />
                    <span className="mono-id text-[0.65rem] uppercase text-muted-foreground">
                      {item.version}
                    </span>
                    {item.frozen && (
                      <span className="mono-id inline-flex items-center gap-1 text-[0.65rem] uppercase text-accent">
                        <Snowflake className="size-3" /> Frozen
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <HashChip hash={item.sha256} verified={item.integrity_ok} />
                    <button
                      onClick={() => openEvidence(item)}
                      className="ml-auto rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/60 hover:text-primary"
                    >
                      Open &amp; log access
                    </button>
                  </div>
                  {item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((t: string) => (
                        <span
                          key={t}
                          className="mono-id rounded-sm border border-border px-2 py-0.5 text-[0.6rem] uppercase text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
              {data?.evidence.length === 0 && (
                <li className="text-sm text-muted-foreground">No evidence lodged yet.</li>
              )}
            </ul>
          </Panel>

          <Panel title="Lodge new evidence" subtitle="The fingerprint is taken in your browser before the file leaves it">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Evidence title"
                className="rounded-md border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:border-ring"
              />
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as Classification)}
                className="rounded-md border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {classificationLabel(c)}
                  </option>
                ))}
              </select>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              />
              <button
                onClick={uploadEvidence}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Lodge evidence
              </button>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Investigation timeline">
            <ol className="space-y-4">
              {data?.timeline.map((t) => (
                <li key={t.id} className="border-l-2 border-primary/40 pl-3">
                  <p className="mono-id text-[0.65rem] uppercase text-primary">
                    {new Date(t.occurred_on).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </li>
              ))}
              {data?.timeline.length === 0 && (
                <li className="text-sm text-muted-foreground">No dated events yet.</li>
              )}
            </ol>
          </Panel>

          <Panel title="Chain of custody" subtitle="Append-only">
            <ol className="space-y-3">
              {data?.custody.map((e) => (
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
      </div>
    </div>
  );
}
