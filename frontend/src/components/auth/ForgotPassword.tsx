"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/shared/store";
import {
  triggerErrorMsg,
  triggerSuccessMsg,
} from "@/shared/store/thunks/response-thunk";
import axiosInstance from "@/shared/utils/api/axios-instance";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Input } from "@/shared/utils/form/Input";
import PageHeader from "@/shared/ui/PageHeader";
import { useRouter, usePathname } from "next/navigation";

const validationSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
});

interface IForgotPassword {
  email: string;
}

const ForgotPassword: React.FC<{onBack?: () => void}> = ({ onBack }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IForgotPassword>({
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
  });
  
  const isForgotPasswordPage =
    pathname === "/user/account/setting/forgot-password";

  const submitMutation = useMutation({
    mutationFn: async (data: IForgotPassword) => {
      const response = await axiosInstance.post(
        `/user/auth/send-password-reset-link`,
        JSON.stringify(data)
      );
      return response.data;
    },
    onSuccess: ({ message }) => {
      if (!isForgotPasswordPage) dispatch(triggerSuccessMsg(message));
      if (onBack) {
        onBack();
      }
    },
    onError: (error: any) => {
      dispatch(triggerErrorMsg(`${error.response?.data?.message}`));
    },
  });

  const submitHandler: SubmitHandler<IForgotPassword> = async (data) => {
    submitMutation.mutate(data);
  };

  const backHandler = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (submitMutation.isSuccess) {
    return (
      <article className="text-base text-center text-custom_green p-button font-bold">
        Password reset link sent successfully!
      </article>
    );
  }

  const formContent = (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className={
        isForgotPasswordPage
          ? "lg:w-2/3 flex flex-col gap-3"
          : "flex-1 flex flex-col md:flex-row md:items-center gap-2"
      }
    >
      <fieldset className="border-0 p-0 m-0 flex-1">
        <legend className="sr-only">Forgot Password Form</legend>
        <Input
          {...register("email")}
          type="email"
          label={isForgotPasswordPage ? "Email" : undefined}
          error={!!errors.email}
          helperText={errors.email?.message}
          placeholder="Email"
          className="placeholder:text-sm { !isForgotPasswordPage && 'outline-custom_gray' }"
          outerClassProp="flex-1"
        />
      </fieldset>
      <div className="flex-1 flex items-center gap-2">
        <button className="icon_button" onClick={backHandler}>
          <ArrowBackIcon fontSize="medium" />
        </button>
        <button
          aria-disabled={submitMutation.isPending ? "true" : "false"}
          disabled={submitMutation.isPending}
          className={`${
            isForgotPasswordPage ? "base_button" : "auth_button"
          } w-full`}
          type="submit"
        >
          {submitMutation.isPending
            ? "Sending reset password link.."
            : "Send reset password link"}
        </button>
      </div>
    </form>
  );

  return isForgotPasswordPage ? (
    <main role="main" className="w-full flex flex-col gap-4">
      <PageHeader
        header="Forgot Password"
        subHeader="Please provide your email to receive the password reset link."
      />
      {formContent}
    </main>
  ) : (
    formContent
  );
};

export default ForgotPassword;
