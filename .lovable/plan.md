# NEXUS — Secure Digital Evidence & Legal Intelligence Platform

A judge-facing build for SIH. The 30 features you listed are a full product roadmap;
building them all at once produces something half-working everywhere. The plan below
delivers them in four phases, each one demo-complete on its own, starting with the
"most important differentiator" flow end to end.

## Product spine (the demo story)

Sign in with 3 levels → land on a case → open evidence → AI answers with highlighted
source → share it to another office with limits → that office asks to modify → a senior
officer approves with a second identity check → a new version and new fingerprint appear
→ every step shows in the chain of custody and the security centre.

## Phase 1 — Foundation and the spine

- Design system: dark command-centre look, deep navy/steel with a signal-amber accent,
  monospaced fingerprints and IDs. No default template look.
- Backend enabled (Lovable Cloud) with logins, database and file storage.
- Three-level sign in: one-time code, passkey (WebAuthn), then employee ID + password.
  Passkey login for returning users, login history, auto session timeout, lockout after
  repeated failures.
- Employee directory with department, designation, office, role and clearance level.
  Admin can add, disable, change role or clearance, reset authentication.
- Cases with a unique ID (CASE-2026-001), overview, officers, evidence list, timeline.
- Evidence upload with a SHA-256 fingerprint shown on every file and an
  "integrity verified / tampering detected" check on each open.
- Classification on every document (Public → Restricted Evidence) checked against the
  viewer's clearance before anything opens.
- Chain of custody: every create, view, download, share and approval recorded with who,
  what, when, which office, why and outcome.

## Phase 2 — Controlled sharing and approvals

- Share specific documents to a named officer with purpose, expiry and toggles for
  download, print and re-share. Never "share the whole case".
- Cross-office tracking board: who received, opened, downloaded, printed, commented,
  attempted a change, and when access expires — as a live activity timeline.
- Modification approval workflow: request → senior officer reviews original vs proposed
  → passkey re-check → approve/reject → new version created, original preserved.
- Version history v1.0 / v1.1 / v1.2 with hash, author, approver, time, office, reason,
  and a side-by-side compare.
- Digital signing of evidence, reports and approvals with a verification badge.
- Notifications for shares, access changes, approvals, integrity failures and alerts.
- Annotations, comments and tags (financial, witness, forensic…) that never touch the
  original file.

## Phase 3 — AI: NEXUS Assistant and Legal Intelligence

- Case assistant answering only from documents the signed-in user may see, replying with
  answer → supporting evidence → source document and page, and opening that page with
  the exact supporting passage highlighted.
- Legal Intelligence: issues, possibly relevant provisions, supporting and contradicting
  evidence, gaps, arguments, preliminary outcome, confidence and sources — always
  labelled an AI preliminary assessment, never a legal opinion.
- Confidence handling: high / medium / insufficient verified information, and an explicit
  refusal to state a provision it cannot verify.
- Natural-language and structured search across cases, people, organisations, locations,
  dates, hashes and officers.
- Evidence relationship graph (case → document → person → organisation → location →
  event), clickable into whatever the viewer is cleared for.
- Auto-built investigation timeline, also answerable as "give me the chronology".

## Phase 4 — Security operations and lifecycle

- Security Centre: failed logins, denied access, suspicious downloads, expired sessions,
  modification attempts, integrity failures, unusual patterns, with severity.
- Insider-threat scoring: volume, off-hours access, repeated denials, unrelated-case
  browsing, escalation attempts → risk score and alert to security officers.
- Risk score per case and per document with its contributing factors.
- Report generation (case summary, investigation, evidence, custody, integrity, access,
  audit, AI assessment) exported as PDF.
- Case closure with senior approval → evidence freeze → archive; per-document freeze;
  deletion only as a reasoned request needing approval, blocked on active critical
  evidence.
- Compliance dashboard: access compliance, integrity, unauthorised access, pending
  approvals, active alerts, audit coverage.
- Mobile evidence capture for field officers, auto-attaching case, officer, time and
  hash; precise location only when authorised.

## Technical notes

- Every table gets row-level rules keyed on case assignment, clearance vs classification,
  and active share grants; a role table separate from the profile table, checked through
  a security-definer function.
- Hashing on upload and on every read; hash history retained per version; frozen and
  archived rows write-blocked at the database level, not just in the interface.
- Documents stored in private buckets; access always through short-lived signed links
  issued after a permission check, so a leaked link cannot be replayed.
- Approvals require a fresh passkey assertion (step-up) recorded with the approval row.
- AI runs server-side over only the documents the caller is cleared for, with citations
  carrying document, page and character offsets so highlighting is exact.
- Audit and custody rows are append-only; no update or delete policy exists for them.

## Scope note

Phase 1 is what I would build first and in full. Say the word and I start there; the
later phases follow in order unless you want a different one pulled forward for the demo.
