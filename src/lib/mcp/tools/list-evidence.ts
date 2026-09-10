import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "list_evidence",
  title: "List evidence",
  description:
    "List evidence items visible to the signed-in officer, with SHA-256 fingerprint and integrity status.",
  inputSchema: {
    case_id: z.string().uuid().optional().describe("Restrict to one case."),
    search: z.string().trim().min(1).optional().describe("Filter by evidence title or number."),
    only_compromised: z
      .boolean()
      .optional()
      .describe("Return only items whose integrity check has failed."),
    limit: z.number().int().min(1).max(100).default(25).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ case_id, search, only_compromised, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("evidence")
      .select(
        "id, case_id, evidence_number, title, description, classification, version, sha256, integrity_ok, frozen, file_name, uploaded_office, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (case_id) query = query.eq("case_id", case_id);
    if (only_compromised) query = query.eq("integrity_ok", false);
    if (search) query = query.or(`title.ilike.%${search}%,evidence_number.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, evidence: data ?? [] });
  },
});
