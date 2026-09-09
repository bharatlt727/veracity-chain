import { Check, ShieldAlert, Fingerprint } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { classificationLabel, classificationTone, shortHash, type Classification } from "@/lib/nexus";

export function ClassificationBadge({
  value,
  className,
}: {
  value: Classification;
  className?: string;
}) {
  const tone = classificationTone(value);
  return (
    <span
      className={cn(
        "mono-id inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[0.65rem] uppercase",
        tone === "muted" && "border-border bg-muted text-muted-foreground",
        tone === "accent" && "border-accent/40 bg-accent/15 text-accent",
        tone === "warning" && "border-warning/40 bg-warning/15 text-warning",
        tone === "destructive" && "border-destructive/50 bg-destructive/15 text-destructive",
        className,
      )}
    >
      {classificationLabel(value)}
    </span>
  );
}

export function HashChip({ hash, verified = true }: { hash: string; verified?: boolean }) {
  const clean = hash.replace(/\s/g, "");
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        title={clean}
        className="mono-id inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2 py-0.5 text-xs"
      >
        <Fingerprint className="size-3.5 text-muted-foreground" />
        {shortHash(clean)}
      </span>
      {verified ? (
        <span className="mono-id inline-flex items-center gap-1 text-[0.65rem] uppercase text-success">
          <Check className="size-3" /> Integrity verified
        </span>
      ) : (
        <span className="mono-id inline-flex items-center gap-1 text-[0.65rem] uppercase text-destructive">
          <ShieldAlert className="size-3" /> Tampering detected
        </span>
      )}
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-5", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  return (
    <div className="panel p-4">
      <p className="label-caps">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-semibold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
