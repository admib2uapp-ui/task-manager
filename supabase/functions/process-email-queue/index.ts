import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface EmailQueueItem {
  id: string;
  user_id: string;
  to_email: string;
  template_name: string;
  subject: string;
  data: Record<string, unknown>;
}

async function getPendingEmails(): Promise<EmailQueueItem[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/get_pending_emails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ limit: 10 }),
    },
  );

  if (!response.ok) {
    console.error("Failed to fetch pending emails:", await response.text());
    return [];
  }

  return response.json();
}

async function sendEmail(item: EmailQueueItem): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await renderTemplate(item.template_name, item.data);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orbit <notifications@orbit.app>",
        to: item.to_email,
        subject: item.subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function renderTemplate(
  templateName: string,
  data: Record<string, unknown>,
): Promise<string> {
  let html = "";

  switch (templateName) {
    case "task-assignment":
      html = `<div style="font-family:sans-serif;padding:24px;background:#18181b;color:#e4e4e7;border-radius:16px">
        <h2 style="color:#fff">Task Assigned to You</h2>
        <p>Hi ${data.userName},</p>
        <p><strong>${data.assignedBy}</strong> has assigned you to <strong>"${data.taskTitle}"</strong> in ${data.projectName}.</p>
        <div style="background:#27272a;border-radius:12px;padding:16px;margin:16px 0">
          <p style="font-size:18px;font-weight:600;color:#fff;margin:0">${data.taskTitle}</p>
          <p style="color:#a1a1aa;margin:8px 0 0">Priority: ${data.priority} ${data.deadline ? `| Deadline: ${data.deadline}` : ""}</p>
        </div>
        <a href="${data.taskUrl}" style="display:inline-block;background:#fff;color:#18181b;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600">Open Task</a>
      </div>`;
      break;

    case "project-assignment":
      html = `<div style="font-family:sans-serif;padding:24px;background:#18181b;color:#e4e4e7;border-radius:16px">
        <h2 style="color:#fff">Project Assignment</h2>
        <p>Hi ${data.userName},</p>
        <p><strong>${data.assignedBy}</strong> added you to <strong>${data.projectName}</strong> as <strong>${data.role}</strong>.</p>
        <a href="${data.projectUrl}" style="display:inline-block;background:#fff;color:#18181b;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600">Open Project</a>
      </div>`;
      break;

    case "deadline-reminder":
      html = `<div style="font-family:sans-serif;padding:24px;background:#18181b;color:#e4e4e7;border-radius:16px">
        <h2 style="color:#fff">Deadline Approaching</h2>
        <p>Hi ${data.userName},</p>
        <p><strong>"${data.taskTitle}"</strong> in ${data.projectName} is due ${data.timeRemaining}.</p>
        <div style="background:#27272a;border-radius:12px;padding:16px;margin:16px 0">
          <p style="font-size:18px;font-weight:600;color:#fff;margin:0">${data.taskTitle}</p>
          <p style="color:#fbbf24;margin:8px 0 0">Due: ${data.deadline}</p>
        </div>
        <a href="${data.taskUrl}" style="display:inline-block;background:#fff;color:#18181b;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600">View Task</a>
      </div>`;
      break;

    case "chat-mention":
      html = `<div style="font-family:sans-serif;padding:24px;background:#18181b;color:#e4e4e7;border-radius:16px">
        <h2 style="color:#fff">You Were Mentioned</h2>
        <p>Hi ${data.userName},</p>
        <p><strong>${data.authorName}</strong> mentioned you in ${data.projectName}.</p>
        <div style="background:#27272a;border-radius:12px;padding:16px;margin:16px 0">
          <p style="font-style:italic;color:#d4d4d8;margin:0">"${data.messageBody}"</p>
        </div>
        <a href="${data.chatUrl}" style="display:inline-block;background:#fff;color:#18181b;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600">Open Chat</a>
      </div>`;
      break;

    default:
      html = `<div style="font-family:sans-serif;padding:24px;background:#18181b;color:#e4e4e7;border-radius:16px">
        <h2 style="color:#fff">${data.heading || "Notification from Orbit"}</h2>
        <p>Hi ${data.userName},</p>
        <p>${data.body || ""}</p>
      </div>`;
  }

  return html;
}

async function markProcessed(id: string, status: string, error?: string) {
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = {
    status,
    attempts: 1,
    last_error: error || null,
  };

  if (status === "sent") {
    updates.sent_at = now;
  }

  await fetch(`${SUPABASE_URL}/rest/v1/email_queue?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(updates),
  });

  if (status === "sent") {
    const { data: queueItem } = await fetch(
      `${SUPABASE_URL}/rest/v1/email_queue?id=eq.${id}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    ).then((r) => r.json());

    const item = Array.isArray(queueItem) ? queueItem[0] : queueItem;

    await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email_queue_id: id,
        user_id: item?.user_id,
        to_email: item?.to_email,
        template_name: item?.template_name,
        subject: item?.subject,
        data: item?.data,
        status: "sent",
      }),
    });
  }
}

serve(async (req) => {
  try {
    const items = await getPendingEmails();

    if (items.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const item of items) {
      const result = await sendEmail(item);

      if (result.success) {
        await markProcessed(item.id, "sent");
        processed++;
      } else {
        await markProcessed(item.id, "failed", result.error);
        console.error(`Failed to send email ${item.id}: ${result.error}`);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Email queue processor error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
