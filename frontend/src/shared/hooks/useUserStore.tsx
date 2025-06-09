import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { merge } from "lodash";

// --- Types ---
interface IUserState {
  is_nav_auth_clicked: boolean;
  is_otp_sent: boolean;
  deactivated_at: string | null;
  is_email_verified: boolean;
}

interface IUserActions {
  handleAuthClick: (val: boolean) => void;
  login: (payload: { is_email_verified: boolean; deactivated_at?: string | null }) => void;
  logout: () => Promise<void>;
  updateUserData: (payload: Partial<IUserState>) => void;
  updateMode: (payload: Partial<IUserState>) => void;
}

type UserStore = IUserState & IUserActions;

// --- Default state ---
const defaultState: IUserState = {
  is_nav_auth_clicked: false,
  is_otp_sent: false,
  deactivated_at: null,
  is_email_verified: false
};

// --- Store ---
const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      handleAuthClick: (val: boolean) => set({ is_nav_auth_clicked: val }),

      login: ({ is_email_verified, deactivated_at }) => {
        set({
          is_email_verified,
          deactivated_at: deactivated_at ?? null,
          is_otp_sent: true,
          is_nav_auth_clicked: is_email_verified ? false : get().is_nav_auth_clicked,
        });
      },

      logout: async () => {
        try {
          const res = await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
          });

          if (res.ok) {
            set({ ...defaultState, is_email_verified: true });
            setTimeout(() => {
              window.location.reload();
            }, 150);
          } else {
            console.error("Logout failed");
          }
        } catch (err) {
          console.error("Logout error", err);
        }
      },

      updateUserData: (payload: Partial<IUserState>) => {
        const newState = merge({}, get(), payload);
        set(newState);
      },

      updateMode: (payload: Partial<IUserState>) => {
        set(payload as IUserState);
      },
    }),
    {
      name: "app_user_state",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUserStore;
