import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@shared/store";
import {
  triggerErrorMsg,
  triggerSuccessMsg,
} from "@shared/store/thunks/response-thunk";
import axiosInstance from "@shared/utils/axios-instance";
import { Input } from "@shared/ui/Input";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import useUserStore from "@shared/hooks/useUserStore";

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
  const { login } = useUserStore();

  // Mutation to send auth data (email/password or googleToken)
  const submitMutation = useMutation({
    mutationFn: async (data: AuthMutationInput) => {
      const response = await axiosInstance.post(
        `/auth`,
        JSON.stringify(data)
      );
      return response.data;
    },
    onSuccess: async ({ isEmailVerified, deactivated_at, message }) => {
      dispatch(triggerSuccessMsg(message));
      login({ is_email_verified: isEmailVerified, deactivated_at });

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
          className="flex flex-col gap-4 w-full"
          onSubmit={handleSubmit(submitHandler)}
        >
          <fieldset className="border-0 p-0 m-0 flex flex-col gap-3 w-full">
            <legend className="sr-only">Login Form</legend>
            <Input
              type="email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              placeholder="Email"
              className="placeholder:text-smay"
              outerClassProp="flex-1"
            />
            <Input
              {...register("password")}
              type="password"
              error={!!errors.password}
              helperText={errors.password?.message}
              placeholder="Password / Create new password"
              className="placeholder:text-sm"
              outerClassProp="flex-1"
            />
          </fieldset>
          <div className="flex items-center gap-2 overflow-hidden w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
              shape="circle"
              text="continue_with"
            />
            <button
              aria-disabled={submitMutation.isPending ? "true" : "false"}
              disabled={submitMutation.isPending}
              type="submit"
              className="custom_go m-1 flex-1"
            >
              {submitMutation.isPending ? "Authenticating..." : "Authenticate"}
            </button>
          </div>
        </form>
      </section>
    </GoogleOAuthProvider>
  );
};

export default AuthItem;
