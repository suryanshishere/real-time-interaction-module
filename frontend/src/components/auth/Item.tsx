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
import { Input } from "@/shared/utils/form/Input";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { SHARED_DB } from "@/db/shared";
import { usePathname } from "next/navigation";
import useUserStore from "@/shared/hooks/useUserStore";

// Validation schema using Yup for the email/password form
const validationSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// This is the form data for email/password login
interface IAuthForm {
  email: string;
  password: string;
}

// Define the mutation input type as a union so it can also accept a Google token
type AuthMutationInput = IAuthForm | { google_token: string };

const AuthItem: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IAuthForm>({
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
  });
  const pathname = usePathname();
  const { login } = useUserStore();

  // Mutation to send auth data (email/password or googleToken)
  const submitMutation = useMutation({
    mutationFn: async (data: AuthMutationInput) => {
      const response = await axiosInstance.post(
        `/user/auth`,
        JSON.stringify(data)
      );
      return response.data;
    },
    onSuccess: async ({
      isEmailVerified,
      role,
      mode,
      deactivated_at,
      message,
    }) => {
      // *** trigger ISR rebuild of this section page ***
      await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-token": SHARED_DB.REVALIDATE_SECRET,
        },
        body: JSON.stringify({ path: pathname }),
      });

      dispatch(triggerSuccessMsg(message));
      login({ is_email_verified: isEmailVerified, role, mode, deactivated_at });

      setTimeout(() => {
        window.location.reload();
      }, 150);
    },
    onError: (error: any) => {
      dispatch(triggerErrorMsg(`${error.response?.data?.message}`));
    },
    retry: 3,
  });

  const submitHandler: SubmitHandler<IAuthForm> = async (data) => {
    submitMutation.mutate(data);
  };

  // Handler for Google Login success
  const handleGoogleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      // Now TypeScript accepts this because it matches { googleToken: string }
      submitMutation.mutate({ google_token: credentialResponse.credential });
    }
  };

  // Handler for Google Login failure
  const handleGoogleFailure = () => {
    dispatch(triggerErrorMsg("Google authentication failed."));
  };

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}
    >
      <section aria-label="User Authentication">
        <form
          className="flex-1 flex flex-col tablet:flex-row tablet:items-center gap-2 justify-end"
          onSubmit={handleSubmit(submitHandler)}
        >
          <fieldset className="border-0 p-0 m-0 flex-1 flex flex-col large_mobile:flex-row large_mobile:items-center gap-2 justify-end">
            <legend className="sr-only">Login Form</legend>
            <Input
              type="email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              placeholder="Email"
              className="placeholder:text-sm outline-custom_gray"
              outerClassProp="flex-1"
            />
            <Input
              {...register("password")}
              type="password"
              error={!!errors.password}
              helperText={errors.password?.message}
              placeholder="Password / Create new password"
              className="placeholder:text-sm outline-custom_gray"
              outerClassProp="flex-1"
            />
          </fieldset>
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              aria-disabled={submitMutation.isPending ? "true" : "false"}
              disabled={submitMutation.isPending}
              type="submit"
              className="w-full auth_button"
            >
              {submitMutation.isPending ? "Authenticating..." : "Authenticate"}
            </button>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
              shape="circle"
              text="continue_with"
            />
          </div>
        </form>
      </section>
    </GoogleOAuthProvider>
  );
};

export default AuthItem;
