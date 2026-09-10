import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listCases from "./tools/list-cases";
import getCase from "./tools/get-case";
import listEvidence from "./tools/list-evidence";
import listCustodyEvents from "./tools/list-custody-events";
import whoami from "./tools/whoami";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "secure-case-nexus",
  title: "Secure Case Nexus",
  version: "0.1.0",
  instructions:
    "Read-only access to the NEXUS secure digital evidence platform for the signed-in officer. Use `whoami` for the officer's clearance, `list_cases` and `get_case` for investigations, `list_evidence` for evidence with SHA-256 fingerprints and integrity status, and `list_custody_events` for the append-only chain of custody. Results are always limited by the officer's clearance level.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listCases, getCase, listEvidence, listCustodyEvents],
});
