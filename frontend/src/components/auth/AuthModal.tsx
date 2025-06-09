"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@shared/ui/Modal";
import AuthFlow from "./AuthFlow";
import useUserStore from "@shared/hooks/useUserStore";

interface AuthModalProps {
  tokenExists: boolean;
}

export default function AuthModal({ tokenExists }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const logout = useUserStore((state) => state.logout);

  return (
    <>
      <div className="absolute sm:static bottom-20 flex flex-col items-center gap-2 justify-center">
        {!tokenExists ? (
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
          <div className="flex justify-center items-center gap-3 w-[20rem] flex-wrap text-sm">
            <Link
              href="user/change-password"
              className="flex gap-1 text-center items-center hover:bg-gray-200 mt-1 py-1 px-6 rounded-full shadow"
            >
              Change Password
            </Link>
            <button
              onClick={logout}
              className="flex gap-1 text-center items-center hover:bg-gray-200 mt-1 py-1 px-6 rounded-full shadow"
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
      >
        <AuthFlow tokenExists={tokenExists} />
      </Modal>
    </>
  );
}
