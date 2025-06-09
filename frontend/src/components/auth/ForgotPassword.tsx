"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@shared/store";
import {
  triggerErrorMsg,
} from "@shared/store/thunks/response-thunk";
import axiosInstance from "@shared/utils/axios-instance";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Input } from "@shared/ui/Input";
import { useRouter, usePathname } from "next/navigation";

const validationSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
});

interface IForgotPassword {
  email: string;
}

const ForgotPassword: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IForgotPassword>({
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: IForgotPassword) => {
      const response = await axiosInstance.post(
        `/user/auth/send-password-reset-link`,
        JSON.stringify(data)
      );
      return response.data;
    },
    onSuccess: ({ message }) => {
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
      className={"flex flex-col gap-3"}
    >
      <fieldset className="border-0 p-0 m-0 flex-1">
        <legend className="sr-only">Forgot Password Form</legend>
        <Input
          {...register("email")}
          type="email"
          label={"Email"}
          error={!!errors.email}
          helperText={errors.email?.message}
          placeholder="Email"
          className="placeholder:text-sm { !isForgotPasswordPage && 'outline-custom_gray' }"
          outerClassProp="flex-1"
        />
      </fieldset>
      <div className="flex-1 flex justify-end items-center gap-3">
        <button className="icon_button" onClick={backHandler}>
          <ArrowBackIcon fontSize="medium" />
        </button>
        <button
          aria-disabled={submitMutation.isPending ? "true" : "false"}
          disabled={submitMutation.isPending}
          type="submit"  className="outline rounded-full mx-1 px-3 py-1 hover:bg-gray-200"
        >
          {submitMutation.isPending
            ? "Sending reset password link.."
            : "Send reset password link"}
        </button>
      </div>
    </form>
  );

  return formContent;
};

export default ForgotPassword;
