import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user } = await getRouteContext();

    const today = new Date().toISOString().split("T")[0];

    const { data: dueTasks } = await supabaseAdmin
      .from("tasks")
      .select("id, title, deadline")
      .eq("assignee_id", user.id)
      .not("status", "eq", "done")
      .not("deadline", "is", null);

    for (const task of dueTasks || []) {
      if (!task.deadline) continue;
      const deadlineDate = task.deadline.split("T")[0];
      let notifType = "deadline";

      if (deadlineDate < today) {
        notifType = "overdue";
      } else if (deadlineDate === today) {
        notifType = "deadline";
      } else {
        continue;
      }

      try {
        await supabaseAdmin.rpc("insert_notification_if_not_exists", {
          p_user_id: user.id,
          p_type: notifType,
          p_title:
            notifType === "overdue"
              ? `Overdue: ${task.title}`
              : `Due today: ${task.title}`,
          p_body: null,
          p_entity_type: "task",
          p_entity_id: task.id,
        });
      } catch {
        // RPC might not exist; fallback to direct insert
        const { data: existing } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("entity_type", "task")
          .eq("entity_id", task.id)
          .eq("type", notifType)
          .maybeSingle();

        if (!existing) {
          await supabaseAdmin.from("notifications").insert({
            user_id: user.id,
            type: notifType,
            title:
              notifType === "overdue"
                ? `Overdue: ${task.title}`
                : `Due today: ${task.title}`,
            body: null,
            entity_type: "task",
            entity_id: task.id,
          });
        }
      }
    }

    const { data } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = data || [];
    const unreadCount = rows.filter((n) => !n.is_read).length;

    return NextResponse.json({
      items: rows,
      unreadCount,
    });
  } catch {
    return unauthorized();
  }
}
