import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Input } from "@shared/ui/Input";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@shared/store";
import {
  triggerErrorMsg,
  triggerSuccessMsg,
} from "@shared/store/thunks/response-thunk";
import axiosInstance from "@shared/utils/axios-instance";
import useUserStore from "@shared/hooks/useUserStore";

const otpSchema = Yup.object().shape({
  email_verification_otp: Yup.number()
    .required("OTP is required.")
    .typeError("OTP must be a number.")
    .test(
      "len",
      "OTP must be exactly 6 digits.",
      (val) => val !== undefined && val.toString().length === 6
    )
    .test(
      "is-positive",
      "OTP must be a positive number.",
      (val) => val !== undefined && val > 0
    ),
});

type OTPFormInputs = {
  email_verification_otp: number;
};

const EmailVerification: React.FC = () => {
  const { is_otp_sent, updateUserData, handleAuthClick, logout } =
    useUserStore();
  const [isSendOnce, setIsSendOnce] = useState<boolean>(is_otp_sent);
  const dispatch = useDispatch<AppDispatch>();
  const [resendTimer, setResendTimer] = useState<number>(0);

  useEffect(() => {
    if (is_otp_sent) {
      setResendTimer(60);
    }
  }, [is_otp_sent]);

  useEffect(() => {
    if (resendTimer > 0) {
      const countdown = setInterval(
        () => setResendTimer((prev) => prev - 1),
        1000
      );
      return () => clearInterval(countdown);
    }
  }, [resendTimer]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormInputs>({
    resolver: yupResolver(otpSchema),
    mode: "onSubmit",
  });

  // Mutation for sending OTP email
  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(`/auth/send-verification-otp`);
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(triggerSuccessMsg(data.message, 10));
      if (!isSendOnce) {
        setIsSendOnce(true);
      }
      setResendTimer(60);
    },
    onError: (error: any) => {
      if (error.response.status === 429) {
        setResendTimer(error.response.data.extraData);
        setIsSendOnce(true);
      }
      dispatch(triggerErrorMsg(`${error.response?.data?.message}`));
    },
  });

  // Mutation for verifying OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (otp: number) => {
      const response = await axiosInstance.post(`/auth/verify-email`, {
        otp,
      });
      return response.data;
    },
    onSuccess: (data) => {
      updateUserData({ is_email_verified: true });
      handleAuthClick(false);
      dispatch(triggerSuccessMsg(data.message));
      window.location.reload();
    },
    onError: (error: any) => {
      dispatch(triggerErrorMsg(`${error.response?.data?.message}`));
    },
  });

  const handleOtpEmail = () => {
    sendOtpMutation.mutate();
  };

  const verifyOtp: SubmitHandler<OTPFormInputs> = async ({
    email_verification_otp,
  }) => {
    verifyOtpMutation.mutate(email_verification_otp);
  };

  return (
    <section aria-label="Email Verification">
      <form
        onSubmit={handleSubmit(verifyOtp)}
        className="h-full flex-1 flex flex-col mobile:flex-row mobile:items-center gap-3 justify-between"
      >
        <div className="flex-wrap self-center w-fit">
          {isSendOnce
            ? "Enter the OTP sent to your email for verification. Check your spam folder if you don't see it."
            : "Generate an OTP to verify your email."}
        </div>
        {!isSendOnce ? (
          <div className="flex gap-4 justify-center items-center">
            <button
              onClick={logout}
              className="flex gap-1 text-center items-center hover:bg-gray-200 mt-1 py-1 px-6 rounded-full shadow"
            >
              Logout
            </button>
            <button
              aria-disabled={sendOtpMutation.isPending ? "true" : "false"}
              onClick={handleOtpEmail}
              disabled={sendOtpMutation.isPending}
              type="button"
              className="custom_go"
            >
              {sendOtpMutation.isPending ? "Generating..." : "Generate OTP"}
            </button>
          </div>
        ) : (
          <fieldset className="border-0 p-0 m-0 flex flex-col mobile:flex-row mobile:items-center gap-3 justify-between">
            <legend className="sr-only">OTP Verification Form</legend>
            <Input
              {...register("email_verification_otp")}
              error={!!errors.email_verification_otp}
              helperText={errors.email_verification_otp?.message}
              type="number"
              placeholder="Enter OTP"
              outerClassProp="flex-1"
            />
            <div className="self-end mobile:self-center flex gap-3">
              <button
                onClick={logout}
                className="flex gap-1 text-center items-center hover:bg-gray-200 mt-1 py-1 px-6 rounded-full shadow"
              >
                Logout
              </button>
              <button
                aria-disabled={sendOtpMutation.isPending ? "true" : "false"}
                className={`custom_go ${
                  resendTimer > 0 || sendOtpMutation.isPending
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                type="button"
                onClick={handleOtpEmail}
                disabled={resendTimer > 0 || sendOtpMutation.isPending}
              >
                {sendOtpMutation.isPending
                  ? "Resending..."
                  : resendTimer > 0
                  ? `Resend (${resendTimer}s)`
                  : "Resend"}
              </button>
              <button
                aria-disabled={verifyOtpMutation.isPending ? "true" : "false"}
                className="custom_go"
                type="submit"
                disabled={verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </fieldset>
        )}
      </form>
    </section>
  );
};

export default EmailVerification;
