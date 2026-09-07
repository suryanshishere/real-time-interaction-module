import { create } from "zustand";

export interface AuthUser {
  id: string;
  googleSub: string;
  email: string;
  name: string | null;
  deactivatedAt: string | null;
}

interface UserStore {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  loadSession: () => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function responseMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message || "Authentication failed.";
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  loadSession: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/session", { credentials: "include" });
      const data = (await response.json()) as { authenticated: boolean; user: AuthUser | null };
      set({ user: data.authenticated ? data.user : null, initialized: true });
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  loginWithGoogle: async (credential) => {
    set({ loading: true });
    try {
      const csrfResponse = await fetch("/api/auth/csrf", { credentials: "include" });
      const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
      const response = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, csrfToken }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const { user } = (await response.json()) as { user: AuthUser };
      set({ user });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useUserStore;
