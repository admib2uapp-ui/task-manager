import { createClient } from "@/lib/supabase/client";
import type { Provider } from "@supabase/supabase-js";

export const authApi = {
  signUp: (email: string, password: string, name: string) => {
    const supabase = createClient();
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
  },

  signIn: (email: string, password: string) => {
    const supabase = createClient();
    return supabase.auth.signInWithPassword({ email, password });
  },

  signOut: () => {
    const supabase = createClient();
    return supabase.auth.signOut();
  },

  getUser: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  signInWithOAuth: (provider: Provider) => {
    const supabase = createClient();
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  updateProfile: async (payload: { name?: string; avatarUrl?: string | null }) => {
    const supabase = createClient();
    const { data } = await supabase.auth.updateUser({
      data: {
        name: payload.name,
        avatar_url: payload.avatarUrl,
      },
    });
    return data.user;
  },
};
