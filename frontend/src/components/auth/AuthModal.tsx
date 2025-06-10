"use client";

import { useState } from "react";
import Modal from "@shared/ui/Modal";
import AuthFlow from "./AuthFlow";
import useUserStore from "@shared/hooks/useUserStore";
import { useEffect } from "react";
import UserCreatedPolls from "@components/UserCreatedPolls";

interface AuthModalProps {
  tokenExists: boolean;
}

export default function AuthModal({ tokenExists }: AuthModalProps) {
  const { is_email_verified, logout, tokenBoolean } = useUserStore();
  const [open, setOpen] = useState(tokenBoolean && !is_email_verified);

  useEffect(() => {
    setOpen(tokenBoolean && !is_email_verified);
  }, [tokenBoolean, is_email_verified]);

  return (
    <>
      <div className="flex flex-col items-center gap-2 justify-center my-6 w-full">
        {!tokenBoolean ? (
          <>
            <button
              onClick={() => setOpen(true)}
              className="flex gap-1 text-center items-center hover:bg-gray-200 mt-1 py-1 px-6 rounded-full shadow"
            >
              Authenticate
            </button>
            <p className="text-xs text-gray-500">
              (You’ll need to log in to create a poll or cast a vote.)
            </p>
          </>
        ) : (
          <div className="flex flex-col justify-center gap-5 w-full sm:w-[30rem] flex-wrap text-sm">
            <UserCreatedPolls />
            <button
              onClick={logout}
              className="flex gap-1 text-center self-center hover:bg-gray-200 mt-1 py-1 px-6 rounded-full shadow"
            >
              Logout
            </button>
          </div>
        )}
        
      </div>

      <Modal
        open={open}
        header="Log in / Sign up"
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        confirmButton={false}
        tokenExists={tokenBoolean}
      >
        <AuthFlow tokenExists={tokenBoolean} />
      </Modal>
    </>
  );
}
