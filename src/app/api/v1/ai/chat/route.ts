import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  getUserWorkspaceRole,
} from "@/lib/supabase/route-handler";
import { callGemini } from "@/lib/ai/gemini";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import {
  buildProjectContext,
  buildWorkspaceContext,
} from "@/lib/ai/context-builder";
import {
  executeAction,
  isDangerousAction,
} from "@/features/ai-manager/actions";

export async function POST(request: Request) {
  try {
    const { user, workspace } = await getRouteContext();
    const body = await request.json();
    const { message, conversationId, projectId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { detail: "Message is required" },
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

    if (!limitedRole) {
      return NextResponse.json(
        { detail: "Could not determine your role" },
        { status: 403 },
      );
    }

    let contextJson: string;
    if (projectId) {
      const context = await buildProjectContext(projectId, workspace.id);
      contextJson = JSON.stringify(context, null, 2);
    } else {
      const context = await buildWorkspaceContext(workspace.id);
      contextJson = JSON.stringify(context, null, 2);
    }

    let convId = conversationId;
    if (!convId) {
      const { data: conv } = await supabaseAdmin
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          workspace_id: workspace.id,
          project_id: projectId || null,
          title: message.slice(0, 80),
        })
        .select()
        .single();

      if (!conv) {
        return NextResponse.json(
          { detail: "Failed to create conversation" },
          { status: 500 },
        );
      }
      convId = conv.id;
    }

    await supabaseAdmin.from("ai_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
      context: { page: projectId ? "project" : "workspace", projectId },
    });

    let geminiResponse;
    try {
      geminiResponse = await callGemini(SYSTEM_PROMPT, message, contextJson);
    } catch (geminiError) {
      const errorMessage =
        geminiError instanceof Error
          ? geminiError.message
          : "AI service error";

      await supabaseAdmin.from("ai_messages").insert({
        conversation_id: convId,
        role: "system",
        content: "AI request failed",
        error: errorMessage,
        status: "failed",
      });

      return NextResponse.json(
        {
          type: "error",
          summary: `I'm having trouble connecting to the AI service. Please try again later.\n\nError: ${errorMessage}`,
          conversationId: convId,
        },
        { status: 200 },
      );
    }

    const { intent, actions, requiresConfirmation, summary } = geminiResponse;

    if (!actions || actions.length === 0) {
      await supabaseAdmin.from("ai_messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: summary,
        action_plan: geminiResponse,
        status: "completed",
      });

      return NextResponse.json({
        type: "chat",
        intent,
        summary,
        conversationId: convId,
      });
    }

    const hasDangerousActions = actions.some((a) =>
      isDangerousAction(a.type),
    );
    const needsConfirmation =
      requiresConfirmation || hasDangerousActions || actions.length > 3;

    if (needsConfirmation) {
      const { data: msg } = await supabaseAdmin
        .from("ai_messages")
        .insert({
          conversation_id: convId,
          role: "assistant",
          content: summary,
          action_plan: geminiResponse,
          status: "pending",
        })
        .select()
        .single();

      return NextResponse.json({
        type: "confirmation",
        summary,
        actions: actions.map((a) => ({
          type: a.type,
          params: a.params,
          dangerous: isDangerousAction(a.type),
        })),
        messageId: msg?.id,
        conversationId: convId,
      });
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

    for (const action of actions) {
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
        ? `${summary}\n\n✅ All ${successCount} action(s) completed successfully.`
        : `${summary}\n\n⚠️ ${successCount} action(s) succeeded, ${failCount} failed.`;

    const actionPlan = {
      intent,
      actions: actions.map((a, i) => ({ ...a, result: results[i] })),
      requiresConfirmation: false,
      summary: resultSummary,
    };

    const { data: assistantMsg } = await supabaseAdmin
      .from("ai_messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: resultSummary,
        action_plan: actionPlan,
        status: "executed",
      })
      .select()
      .single();

    if (assistantMsg) {
      const logInserts = results.map((r) => ({
        message_id: assistantMsg.id,
        action_type: r.type,
        entity_type: r.entityType,
        entity_id: r.entityId || null,
        status: r.success ? "completed" : "failed",
        error: r.error || null,
      }));

      if (logInserts.length > 0) {
        await supabaseAdmin.from("ai_action_logs").insert(logInserts);
      }
    }

    return NextResponse.json({
      type: "action_result",
      summary: resultSummary,
      results,
      conversationId: convId,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return unauthorized();
  }
}
