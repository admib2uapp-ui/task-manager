"use client";

import { useAuthListener } from "@/features/auth/hooks/use-auth";

export function AuthListener() {
  useAuthListener();
  return null;
}
