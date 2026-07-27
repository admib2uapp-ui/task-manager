import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  try {
    await getRouteContext();
    const body = await request.json();

    const { userId, toEmail, templateName, subject, data: emailData, scheduledFor } = body;

    if (!userId || !toEmail || !templateName || !subject) {
      return NextResponse.json(
        { detail: "userId, toEmail, templateName, and subject are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("email_queue")
      .insert({
        user_id: userId,
        to_email: toEmail,
        template_name: templateName,
        subject,
        data: emailData || {},
        scheduled_for: scheduledFor || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
