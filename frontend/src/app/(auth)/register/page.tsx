import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Start organizing your projects in minutes.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
