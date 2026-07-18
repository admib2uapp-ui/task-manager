import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const next = searchParams.get("next") ?? "/dashboard";

  if (accessToken && refreshToken) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Redirecting...</title></head>
        <body>
          <script>
            window.localStorage.setItem("orbit.auth.session", JSON.stringify({
              accessToken: ${JSON.stringify(accessToken)},
              refreshToken: ${JSON.stringify(refreshToken)},
            }));
            window.location.href = ${JSON.stringify(`${origin}${next}`)};
          </script>
        </body>
      </html>
    `;
    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
