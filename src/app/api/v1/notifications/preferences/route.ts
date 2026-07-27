import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

function mapPreferences(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    assignmentEmails: row.assignment_emails,
    deadlineEmails: row.deadline_emails,
    chatEmails: row.chat_emails,
    githubEmails: row.github_emails,
    aiEmails: row.ai_emails,
    securityEmails: row.security_emails,
    workspaceEmails: row.workspace_emails,
    systemEmails: row.system_emails,
  };
}

export async function GET() {
  try {
    const { user } = await getRouteContext();

    const { data, error } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    if (!data) {
      const { data: created, error: createError } = await supabaseAdmin
        .from("notification_preferences")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ detail: createError.message }, { status: 400 });
      }

      return NextResponse.json(mapPreferences(created));
    }

    return NextResponse.json(mapPreferences(data));
  } catch {
    return unauthorized();
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await getRouteContext();
    const body = await request.json();

    const fieldMap: Record<string, string> = {
      assignmentEmails: "assignment_emails",
      deadlineEmails: "deadline_emails",
      chatEmails: "chat_emails",
      githubEmails: "github_emails",
      aiEmails: "ai_emails",
      securityEmails: "security_emails",
      workspaceEmails: "workspace_emails",
      systemEmails: "system_emails",
    };

    const updates: Record<string, unknown> = {};
    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (typeof body[camel] === "boolean") {
        updates[snake] = body[camel];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { detail: "No valid preference fields provided" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ detail: error.message }, { status: 400 });
      }

      return NextResponse.json(mapPreferences(data));
    }

    const { data, error } = await supabaseAdmin
      .from("notification_preferences")
      .insert({ user_id: user.id, ...updates })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(mapPreferences(data));
  } catch {
    return unauthorized();
  }
}
