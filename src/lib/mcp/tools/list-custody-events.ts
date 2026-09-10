import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "list_custody_events",
  title: "List chain-of-custody events",
  description:
    "Read the append-only chain-of-custody trail for evidence the signed-in officer may access.",
  inputSchema: {
    case_id: z.string().uuid().optional(),
    evidence_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(200).default(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ case_id, evidence_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("custody_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (case_id) query = query.eq("case_id", case_id);
    if (evidence_id) query = query.eq("evidence_id", evidence_id);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, events: data ?? [] });
  },
});
