"use client";

import { authApi } from "@/features/auth/api/auth-api";
import { useOAuthProviders } from "@/features/auth/hooks/use-oauth-providers";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.8v3.6h5.1c-.2 1.3-1.6 3.9-5.1 3.9-3.1 0-5.6-2.5-5.6-5.7S8.9 6.9 12 6.9c1.8 0 3 .8 3.6 1.4l2.5-2.4C16.5 4.4 14.5 3.6 12 3.6 6.9 3.6 2.8 7.7 2.8 12.9S6.9 22.2 12 22.2c6 0 9.3-4.2 9.3-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export function OAuthButtons() {
  const { data: providers } = useOAuthProviders();
  const google = providers?.google;
  const github = providers?.github;

  if (!google && !github) return null;

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {google && (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-2 rounded-xl"
            onClick={() => {
              window.location.href = authApi.oauthStartUrl("google");
            }}
          >
            <GoogleIcon /> Continue with Google
          </Button>
        )}
        {github && (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-2 rounded-xl"
            onClick={() => {
              window.location.href = authApi.oauthStartUrl("github");
            }}
          >
            <GithubIcon /> Continue with GitHub
          </Button>
        )}
      </div>
      <div className="relative flex items-center">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground px-3 text-xs">or</span>
        <span className="bg-border h-px flex-1" />
      </div>
    </div>
  );
}
