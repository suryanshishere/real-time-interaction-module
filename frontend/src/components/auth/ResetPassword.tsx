"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { AppDispatch } from "@shared/store";
import axiosInstance from "@shared/utils/axios-instance";
import {
  triggerErrorMsg,
  triggerSuccessMsg,
} from "@shared/store/thunks/response-thunk";
import PageHeader from "@shared/ui/PageHeader";
import { Input } from "@shared/ui/Input";

const validationSchema = yup.object().shape({
  new_password: yup.string().required("New password is required"),
  confirm_new_password: yup
    .string()
    .oneOf([yup.ref("new_password")], "Passwords must match")
    .required("Confirm new password is required"),
});

interface IResetPasswordForm {
  new_password: string;
  confirm_new_password: string;
}

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const resetPasswordToken = params.resetPasswordToken;
  const dispatch = useDispatch<AppDispatch>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IResetPasswordForm>({
    resolver: yupResolver(validationSchema),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: IResetPasswordForm) => {
      const response = await axiosInstance.post(
        "user/auth/reset-password",
        JSON.stringify({
          resetPasswordToken,
          password: data.new_password,
        })
      );
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(triggerSuccessMsg(data.message));
      router.push("/");
    },
    onError: (error: any) => {
      dispatch(triggerErrorMsg(`${error.response?.data?.message}`));
    },
  });

  const submitHandler: SubmitHandler<IResetPasswordForm> = (data) => {
    submitMutation.mutate(data);
  };

  if (resetPasswordToken?.length !== 30)
    return (
      <section role="alert" className="w-full flex flex-col gap-8 items-center">
        <p className="text-center text-custom_red">
          Not a valid reset password link. <br />
          <strong>Try again</strong> if problem persist.
        </p>
      </section>
    );

  return (
    <main role="main" className="flex flex-col gap-4">
      <PageHeader
        header="Reset Password"
        subHeader="This action will replace your old password."
      />
      <form
        onSubmit={handleSubmit(submitHandler)}
        className="w-3/4 flex flex-col gap-4"
        aria-labelledby="reset-password-header"
      >
        <h1 id="reset-password-header" className="sr-only">
          Reset Password
        </h1>
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-3">
          <legend className="sr-only">Reset Password Form</legend>
          <Input
            {...register("new_password")}
            type="password"
            label="New password"
            error={!!errors.new_password}
            helperText={errors.new_password?.message}
          />
          <Input
            {...register("confirm_new_password")}
            type="password"
            label="Confirm new password"
            error={!!errors.confirm_new_password}
            helperText={errors.confirm_new_password?.message}
          />
        </fieldset>
        <button type="submit" className="ml-auto base_button">
          {submitMutation.isPending
            ? "Submitting Reset Password.."
            : "Reset Password"}
        </button>
      </form>
    </main>
  );
};

export default ResetPassword;
