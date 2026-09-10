import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "list_cases",
  title: "List cases",
  description:
    "List investigation cases visible to the signed-in officer at their clearance level.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Filter by case title or case number."),
    status: z
      .enum(["OPEN", "UNDER_REVIEW", "FROZEN", "CLOSED", "ARCHIVED"])
      .optional()
      .describe("Filter by case status."),
    limit: z.number().int().min(1).max(100).default(25).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("cases")
      .select("id, case_number, title, summary, classification, status, office, risk_score, opened_on")
      .order("opened_on", { ascending: false })
      .limit(limit ?? 25);
    if (status) query = query.eq("status", status);
    if (search) query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, cases: data ?? [] });
  },
});
