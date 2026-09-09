# NEXUS roadmap

## Phase 1 — Foundation and spine (done)
- [x] Design system (command-centre dark, amber signal accent)
- [x] Backend: logins, database, private evidence file store
- [x] Three-level sign in (one-time code → device passkey → employee ID + password)
- [x] Login history, device enrolment, 30-minute inactivity timeout
- [x] Employee directory with clearance levels and account status
- [x] Cases register + case file with evidence vault and timeline
- [x] SHA-256 fingerprint at upload, integrity badge on every item
- [x] Classification vs clearance enforced in the database
- [x] Append-only chain of custody

## Phase 2 — Controlled sharing and approvals (next)
- [ ] Document-level sharing with purpose, expiry, download/print/re-share limits
- [ ] Cross-office tracking board with live activity timeline
- [ ] Modification request → senior approval with passkey step-up → new version
- [ ] Version history with compare, digital signatures
- [ ] Notifications, annotations, tags

## Phase 3 — AI
- [ ] NEXUS case assistant limited to authorised documents, with source highlighting
- [ ] Legal intelligence with confidence levels and citation refusal
- [ ] Natural-language search, relationship graph, auto chronology

## Phase 4 — Security operations and lifecycle
- [ ] Security centre, insider-threat scoring, risk scores
- [ ] Report generation and PDF export
- [ ] Case closure, evidence freeze workflow, approval-gated deletion
- [ ] Compliance dashboard, mobile evidence capture
