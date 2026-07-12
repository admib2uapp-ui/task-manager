import type { User } from "@/types/domain";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface AuthResponse extends TokenPair {
  user: User;
}

export type AuthStatus =
  "idle" | "loading" | "authenticated" | "unauthenticated";
