import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
} from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  try {
    await getRouteContext();
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { detail: "messageId is required" },
        { status: 400 },
      );
    }

    const { data: msg, error: msgError } = await supabaseAdmin
      .from("ai_messages")
      .select("id, conversation_id, status")
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

    await supabaseAdmin
      .from("ai_messages")
      .update({ status: "rejected" })
      .eq("id", messageId);

    return NextResponse.json({
      type: "cancelled",
      summary: "Action cancelled.",
      conversationId: msg.conversation_id,
    });
  } catch (error) {
    console.error("AI cancel error:", error);
    return unauthorized();
  }
}
