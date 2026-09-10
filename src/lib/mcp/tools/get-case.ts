import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "get_case",
  title: "Get case detail",
  description:
    "Fetch one case with its evidence items and investigation timeline, by case number or case id.",
  inputSchema: {
    case_number: z.string().trim().min(1).optional().describe("e.g. CASE-2026-001"),
    case_id: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ case_number, case_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    if (!case_number && !case_id) return errorResult("Provide case_number or case_id.");
    const supabase = supabaseForUser(ctx);

    let caseQuery = supabase.from("cases").select("*").limit(1);
    caseQuery = case_id ? caseQuery.eq("id", case_id) : caseQuery.eq("case_number", case_number!);
    const { data: found, error } = await caseQuery.maybeSingle();
    if (error) return errorResult(error.message);
    if (!found) return errorResult("Case not found, or above your clearance level.");

    const [{ data: evidence }, { data: timeline }] = await Promise.all([
      supabase
        .from("evidence")
        .select(
          "id, evidence_number, title, description, classification, version, sha256, integrity_ok, frozen, uploaded_office, created_at",
        )
        .eq("case_id", found.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("case_timeline")
        .select("*")
        .eq("case_id", found.id)
        .order("occurred_at", { ascending: false })
        .limit(50),
    ]);

    return textResult({ case: found, evidence: evidence ?? [], timeline: timeline ?? [] });
  },
});
