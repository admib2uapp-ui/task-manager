import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { count } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      status: "healthy",
      environment: process.env.ENVIRONMENT || "development",
      version: "1.0.0",
      time: new Date().toISOString(),
      db: count !== null ? "connected" : "disconnected",
    });
  } catch {
    return NextResponse.json({
      status: "degraded",
      environment: process.env.ENVIRONMENT || "development",
      version: "1.0.0",
      time: new Date().toISOString(),
      db: "disconnected",
    });
  }
}
