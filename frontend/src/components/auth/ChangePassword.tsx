"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { AppDispatch } from "@shared/store";
import axiosInstance from "@shared/utils/axios-instance";
import {
  triggerErrorMsg,
  triggerSuccessMsg,
} from "@shared/store/thunks/response-thunk";
import PageHeader from "@shared/ui/PageHeader";
import { Input } from "@shared/ui/Input";

// Validation schema using Yup
const validationSchema = yup.object().shape({
  old_password: yup.string().required("Old password is required"),
  new_password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required")
    .test(
      "not-same-as-old-password",
      "New password must not be the same as the old password",
      function (value) {
        const { old_password } = this.parent;
        return value !== old_password;
      }
    ),
  confirm_new_password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .oneOf([yup.ref("new_password")], "Passwords must match")
    .required("Confirm password is required"),
});

interface IChangePasswordForm {
  old_password: string;
  new_password: string;
  confirm_new_password: string;
  old_password_not_match?: string;
}

const ChangePassword: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IChangePasswordForm>({
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
  });

  // API mutation using Tanstack Query
  const changePasswordMutation = useMutation({
    mutationFn: async (data: IChangePasswordForm) => {
      const response = await axiosInstance.post(
        "/user/account/setting/change-password",
        JSON.stringify(data)
      );
      return response.data;
    },
    onSuccess: ({ message }) => {
      dispatch(triggerSuccessMsg(message || "Password changed successfully!"));
    },
    onError: (error: any) => {
      dispatch(
        triggerErrorMsg(
          `${error.response?.data?.message || "Something went wrong!"}`
        )
      );
    },
  });

  const submitHandler: SubmitHandler<IChangePasswordForm> = (data) => {
    changePasswordMutation.mutate(data);
  };

  if (changePasswordMutation.isSuccess) {
    return (
      <p className="text-base text-center text-custom_green p-button font-bold">
        Password changed successfully!
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        header="Change Your Password"
        subHeader="Strong password for the best protection."
      />
      {errors.old_password_not_match?.message && (
        <p className="text-custom_red">
          {errors.old_password_not_match?.message}
        </p>
      )}
      <form
        onSubmit={handleSubmit(submitHandler)}
        className="lg:w-2/3 flex flex-col gap-4"
      >
        <div className="gap-3 flex flex-col">
          <Input
            label="Old Password"
            type="password"
            error={!!errors.old_password}
            helperText={errors.old_password?.message}
            {...register("old_password")}
          />
          <Input
            label="New Password"
            type="password"
            error={!!errors.new_password}
            helperText={errors.new_password?.message}
            {...register("new_password")}
          />
          <Input
            label="Confirm New Password"
            type="password"
            error={!!errors.confirm_new_password}
            helperText={errors.confirm_new_password?.message}
            {...register("confirm_new_password")}
          />
        </div>
        <div className="flex justify-between items-center gap-8">
          <Link
            href="/user/account/setting/forgot-password"
            className="text-custom_red text-sm"
          >
            Forgot Password?
          </Link>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="base_button flex-1"
          >
            {changePasswordMutation.isPending
              ? "Changing password..."
              : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
