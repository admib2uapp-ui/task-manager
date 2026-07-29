import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  getUserWorkspaceRole,
} from "@/lib/supabase/route-handler";
import { executeAction } from "@/features/ai-manager/actions";

export async function POST(request: Request) {
  try {
    const { user, workspace } = await getRouteContext();
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { detail: "messageId is required" },
        { status: 400 },
      );
    }

    const role = await getUserWorkspaceRole(user.id, workspace.id);
    const limitedRole =
      role === "junior"
        ? "junior"
        : role === "general"
          ? "general"
          : role === "senior"
            ? "senior"
            : "owner";

    const { data: msg, error: msgError } = await supabaseAdmin
      .from("ai_messages")
      .select("id, conversation_id, action_plan, content, status")
      .eq("id", messageId)
      .single();

    if (msgError || !msg) {
      return NextResponse.json(
        { detail: "Message not found" },
        { status: 404 },
      );
    }

    if (msg.status !== "pending") {
      return NextResponse.json(
        {
          detail: `Action is not pending. Current status: ${msg.status}`,
        },
        { status: 400 },
      );
    }

    const actionPlan = msg.action_plan as {
      intent: string;
      actions: Array<{ type: string; params: Record<string, unknown> }>;
      summary: string;
    } | null;

    if (!actionPlan?.actions) {
      return NextResponse.json(
        { detail: "No actions found in message" },
        { status: 400 },
      );
    }

    const actionParams = {
      workspaceId: workspace.id,
      userId: user.id,
      userRole: limitedRole,
    };

    const results: Array<{
      type: string;
      success: boolean;
      entityType: string;
      entityId?: string;
      error?: string;
    }> = [];

    for (const action of actionPlan.actions) {
      const result = await executeAction(
        action.type,
        actionParams,
        action.params,
      );
      results.push({
        type: action.type,
        success: result.success,
        entityType: result.entityType,
        entityId: result.entityId,
        error: result.error,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    const resultSummary =
      failCount === 0
        ? `${actionPlan.summary}\n\n✅ All ${successCount} action(s) completed successfully.`
        : `${actionPlan.summary}\n\n⚠️ ${successCount} action(s) succeeded, ${failCount} failed.`;

    await supabaseAdmin
      .from("ai_messages")
      .update({
        status: "executed",
        content: resultSummary,
        action_plan: {
          ...actionPlan,
          actions: actionPlan.actions.map((a, i) => ({
            ...a,
            result: results[i],
          })),
        },
      })
      .eq("id", messageId);

    const logInserts = results.map((r) => ({
      message_id: messageId,
      action_type: r.type,
      entity_type: r.entityType,
      entity_id: r.entityId || null,
      status: r.success ? "completed" : "failed",
      error: r.error || null,
    }));

    if (logInserts.length > 0) {
      await supabaseAdmin.from("ai_action_logs").insert(logInserts);
    }

    return NextResponse.json({
      type: "action_result",
      summary: resultSummary,
      results,
      conversationId: msg.conversation_id,
    });
  } catch (error) {
    console.error("AI confirm error:", error);
    return unauthorized();
  }
}
