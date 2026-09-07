import { useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import UserCreatedPolls from "@components/UserCreatedPolls";
import useUserStore from "@shared/hooks/useUserStore";
import type { AppDispatch } from "@shared/store";
import { triggerErrorMsg, triggerSuccessMsg } from "@shared/store/thunks/response-thunk";

export default function GoogleAuthPanel() {
  const { user, loading, initialized, loadSession, loginWithGoogle, logout } = useUserStore();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!initialized) void loadSession();
  }, [initialized, loadSession]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return <p className="text-sm text-red-600">Google login needs VITE_GOOGLE_CLIENT_ID.</p>;
  }
  if (loading && !initialized) return <p className="text-sm text-gray-500">Checking session…</p>;
  if (!user) {
    return (
      <section className="flex flex-col items-center gap-3" aria-label="Authentication">
        <p className="text-xs text-gray-500">Sign in with Google to create a poll or vote.</p>
        <GoogleLogin
          shape="pill"
          text="continue_with"
          onSuccess={(result) => {
            if (!result.credential) return;
            void loginWithGoogle(result.credential)
              .then(() => dispatch(triggerSuccessMsg("Signed in successfully.")))
              .catch((error: Error) => dispatch(triggerErrorMsg(error.message)));
          }}
          onError={() => dispatch(triggerErrorMsg("Google sign-in was cancelled or failed."))}
        />
      </section>
    );
  }
  return (
    <section className="flex w-full max-w-[30rem] flex-col items-center gap-4 text-sm">
      <p>Signed in as <strong>{user.name || user.email}</strong></p>
      <UserCreatedPolls />
      <button type="button" disabled={loading} onClick={() => void logout()} className="rounded-full px-6 py-1 shadow hover:bg-gray-200 disabled:opacity-50">Sign out</button>
    </section>
  );
}
