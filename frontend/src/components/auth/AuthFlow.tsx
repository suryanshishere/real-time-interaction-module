"use client";

import React, { useState } from "react";
import ForgotPassword from "./ForgotPassword";
import Item from "./Item";
import EmailVerification from "./EmailVerification";
import Link from "next/link";
import useUserStore from "@/shared/hooks/useUserStore";

export interface AuthProps {
  onBack?: () => void;
  onBackLogin?: () => void;
  forgotPasswordClicked?: () => void;
  signupDataForwardHandler?: (email: string, message: string) => void;
  className?: string;
  tokenExists: boolean;
}

const AuthFlow: React.FC<AuthProps> = ({ tokenExists = false }) => {
  const [authFlow, setAuthFlow] = useState<string>("AUTH");
  const { is_email_verified, logout, handleAuthClick } = useUserStore();

  const renderButtons = () => (
    <nav
      aria-label="Authentication Actions"
      className="gap-x-3 flex large_mobile:flex-col self-center large_mobile:gap-[3px] items-start text-xs"
    >
      {!tokenExists && authFlow === "AUTH" && (
        <button
          onClick={() => setAuthFlow("FORGET_PASSWORD")}
          className="hover:text-custom_less_red text-left"
        >
          Forgot Password?
        </button>
      )}

      {!tokenExists && authFlow === "FORGET_PASSWORD" && (
        <button
          onClick={() => setAuthFlow("AUTH")}
          className="hover:text-custom_less_red text-left"
        >
          Back to Login / Signup
        </button>
      )}

      {tokenExists && !is_email_verified && (
        <button
          onClick={logout}
          className="hover:text-custom_less_red text-left"
        >
          Logout
        </button>
      )}

      <Link href="/contact" className="hover:text-custom_less_red max-w-fit">
        Need help?
      </Link>

      {(!tokenExists || is_email_verified) && (
        <button
          onClick={() => handleAuthClick(false)}
          className="hover:text-custom_less_red"
        >
          Close
        </button>
      )}
    </nav>
  );

  const renderComponents = () => {
    if (tokenExists && !is_email_verified)
      return (
        <section aria-label="Email Verification" className="flex-1">
          <EmailVerification />
        </section>
      );

    if (authFlow === "FORGET_PASSWORD") {
      return (
        <section aria-label="Forgot Password" className="flex-1">
          <ForgotPassword onBack={() => setAuthFlow("AUTH")} />
        </section>
      );
    }

    if (authFlow === "AUTH") {
      return (
        <section aria-label="Login / Signup" className="flex-1">
          <Item />
        </section>
      );
    }
  };

  return (
    <main
      role="main"
      className="w-full flex flex-col large_mobile:flex-row large_mobile:items-center gap-3"
    >
      {renderComponents()}
      {renderButtons()}
    </main>
  );
};

export default AuthFlow;
