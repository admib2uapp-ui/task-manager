import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireProjectMember,
  badRequest,
} from "@/lib/supabase/route-handler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file) return badRequest("No file provided");

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) return badRequest("File exceeds 50MB limit");

    const allowedTypes = [
      "image/", "application/pdf", "application/vnd.openxmlformats-officedocument",
      "application/msword", "application/vnd.ms-excel",
      "application/zip", "video/", "text/", "application/json",
    ];

    const isAllowed = allowedTypes.some((t) => file.type.startsWith(t));
    if (!isAllowed) return badRequest("File type not supported");

    const ext = file.name.split(".").pop() || "";
    const storedName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("chat-attachments")
      .upload(storedName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return badRequest(uploadError.message);

    const { data: urlData } = supabaseAdmin.storage
      .from("chat-attachments")
      .getPublicUrl(storedName);

    const fileUrl = urlData.publicUrl;

    if (messageId) {
      const { data: attachment, error: dbError } = await supabaseAdmin
        .from("chat_attachments")
        .insert({
          message_id: messageId,
          file_name: file.name,
          stored_name: storedName,
          file_url: fileUrl,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();

      if (dbError) return badRequest(dbError.message);

      return NextResponse.json(attachment, { status: 201 });
    }

    return NextResponse.json(
      { fileName: file.name, storedName, fileUrl, mimeType: file.type, sizeBytes: file.size },
      { status: 201 },
    );
  } catch {
    return unauthorized();
  }
}
