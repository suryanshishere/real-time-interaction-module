import { Response, NextFunction, Request } from "express";
import HttpError from "@utils/http-errors";
import bcrypt from "bcryptjs";
import sendEmail from "./send-email";
import User, { IUser } from "@models/User";
import {
  checkRequestDelay,
  sendAuthenticatedResponse,
  sendVerificationResponse,
  updateUnverifiedUser,
} from "./utils";
import { handleValidationErrors } from "../utils";
import { OAuth2Client } from "google-auth-library";
import lodash from "lodash";
const { random } = lodash;

const EMAIL_VERIFICATION_OTP_EXPIRY = 15; // in minutes
const PASSWORD_RESET_TOKEN_EXPIRY = 15; // in minutes
const UNVERIFIED_USER_EXPIRY = 15; // in minutes


export interface IUserData {
  userId: string;
  email: string;
  role?: string;
  deactivated_at?: Date | null;
}

export interface CustomRequest extends Request {
  userData?: IUserData;
}

export const auth = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const errors = handleValidationErrors(req, next);
    if (errors) return;

    const { email, password, google_token } = req.body;

    if (google_token) {
      try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: google_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email) {
          return next(new HttpError("Google authentication failed: no email found.", 401));
        }

        let user = await User.findOne({
          $or: [{ email: payload.email }, { secondary_email: payload.email }],
        });

        if (!user) {
          user = new User({
            email: payload.email,
            name: payload.name,
            isEmailVerified: true,
            password: await bcrypt.hash(random(100000, 999999).toString(), 12),
            google_only: true,
          });
          await user.save();
        }

        sendAuthenticatedResponse(
          res,
          user,
          true,
          user.secondary_email ? user.secondary_email === email : false
        );
        return;
      } catch (error) {
        console.error("Google Auth error:", error);
        return next(new HttpError("Google authentication failed.", 500));
      }
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { secondary_email: email }],
    });

    if (existingUser) {
      const isValidPassword = await bcrypt.compare(password, existingUser.password as string);

      if (!existingUser.isEmailVerified) {
        await updateUnverifiedUser(existingUser, password);
        return sendVerificationResponse(req, res, next, existingUser);
      }

      if (!isValidPassword) {
        if (existingUser.google_only) {
          return next(new HttpError(
            "Invalid credentials. This account is linked to a different login method.",
            401
          ));
        }
        return next(new HttpError("Invalid credentials, could not log you in.", 401));
      }

      sendAuthenticatedResponse(
        res,
        existingUser,
        true,
        existingUser.secondary_email ? existingUser.secondary_email === email : false
      );
      return;
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        email,
        password: hashedPassword,
        google_only: false,
        emailVerificationToken: random(100000, 999999),
        emailVerificationTokenCreatedAt: new Date(),
        expireAt: new Date(Date.now() + UNVERIFIED_USER_EXPIRY * 60 * 1000),
      });
      await newUser.save();

      return sendVerificationResponse(req, res, next, newUser);
    }
  } catch (err) {
    console.error(err);
    return next(new HttpError("Authentication failed, please try again.", 500));
  }
};

export const sendPasswordResetLink = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const errors = handleValidationErrors(req, next);
  if (errors) return;

  const { email } = req.body;
  const userId = req.userData?.userId;

  try {
    let existingUser: IUser | null;
    existingUser = userId ? await User.findById(userId) : await User.findOne({ email });

    if (!existingUser || !existingUser.isEmailVerified) {
      return next(new HttpError("User not found!", 404));
    }

    if (userId && existingUser.email !== email) {
      return next(new HttpError("User does not match the provided email!", 404));
    }

    const delayInSeconds = existingUser.passwordResetTokenCreatedAt
      ? checkRequestDelay(existingUser.passwordResetTokenCreatedAt, 60)
      : null;

    if (delayInSeconds !== null) {
      return next(new HttpError(
        `Please wait ${delayInSeconds} second(s) or use the last reset link.`,
        429,
        delayInSeconds
      ));
    }

    existingUser.passwordResetToken = random(100000, 999999);
    existingUser.passwordResetTokenCreatedAt = new Date();
    await existingUser.save();

    const FRONTEND_URL = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/user/reset-password`
      : "http://localhost:3000/user/reset-password";

    await sendEmail(
      next,
      existingUser.email,
      "Reset your password (Valid for 3min)",
      `${FRONTEND_URL}/${existingUser.id + existingUser.passwordResetToken}`
    );

    res.status(200).json({ message: "Reset password link sent successfully." });
    return;
  } catch (err) {
    return next(
      new HttpError("An error occurred while sending the reset link. Please try again later.", 500)
    );
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const errors = handleValidationErrors(req, next);
  if (errors) return;

  let { resetPasswordToken, password } = req.body;
  const userId = resetPasswordToken?.slice(0, -6);
  resetPasswordToken = resetPasswordToken?.slice(-6);

  try {
    const existingUser = await User.findById(userId);
    if (!existingUser || !existingUser.isEmailVerified) {
      return next(new HttpError("User not found or email not verified!", 404));
    }

    if (
      !existingUser.passwordResetToken ||
      !existingUser.passwordResetTokenCreatedAt
    ) {
      return next(new HttpError("No password reset request found. Please initiate again.", 400));
    }

    if (!resetPasswordToken || existingUser.passwordResetToken !== resetPasswordToken) {
      return next(new HttpError("Invalid reset token!", 400));
    }

    const tokenExpirationTime = new Date(
      existingUser.passwordResetTokenCreatedAt.getTime() +
        PASSWORD_RESET_TOKEN_EXPIRY * 60 * 1000
    );
    const currentTime = new Date();

    if (currentTime > tokenExpirationTime) {
      return next(new HttpError("Reset token has expired. Please request a new one.", 410));
    }

    const isPasswordSimilar = await bcrypt.compare(password, existingUser.password);
    if (isPasswordSimilar) {
      return next(new HttpError("New password cannot be same as old one.", 400));
    }

    existingUser.password = await bcrypt.hash(password, 12);
    existingUser.passwordChangedAt = currentTime;
    if (!existingUser.isEmailVerified) {
      existingUser.isEmailVerified = true;
      existingUser.expireAt = undefined;
    }
    existingUser.passwordResetToken = undefined;
    existingUser.passwordResetTokenCreatedAt = undefined;
    await existingUser.save();

    res.status(200).json({ message: "Password updated successfully." });
    return;
  } catch (error) {
    return next(new HttpError("An unexpected error occurred. Please try again later.", 500));
  }
};

export const sendVerificationOtp = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
  options: { userId?: string; email?: string; token?: number; isDirect?: boolean } = {}
) => {
  if (!options.isDirect) {
    const errors = handleValidationErrors(req, next);
    if (errors) return;
  }

  const userId = options.isDirect ? options.userId : req.userData?.userId;

  try {
    let user: IUser | null = null;
    if (!options.email) {
      user = await User.findById(userId);
      if (!user) {
        return next(new HttpError("User not found. Please re-login or sign up.", 404));
      } else if (user.isEmailVerified) {
        return next(new HttpError("User email already verified!", 409));
      }
    }

    const delayInSeconds = checkRequestDelay(
      user?.emailVerificationTokenCreatedAt,
      60
    );

    if (delayInSeconds !== null) {
      return next(
        new HttpError(
          `Please wait for ${delayInSeconds} second(s) or verify your last OTP.`,
          429,
          delayInSeconds
        )
      );
    }

    const emailToSend = options.email || user?.email;
    if (!emailToSend) return next(new HttpError("Email address is required!", 400));

    const verificationToken = options.token ?? random(100000, 999999);
    if (user) {
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenCreatedAt = new Date();
      await user.save();
    }

    await sendEmail(
      next,
      emailToSend,
      "Verify your email through OTP (Valid for 3min)",
      `${verificationToken}`
    );

    if (options.isDirect) return;

    res.status(200).json({ message: "OTP sent to your email successfully" });
    return;
  } catch (error) {
    return next(new HttpError("Error sending verification email, try again later", 500));
  }
};

export const verifyEmail = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
  isDirect: boolean = false
) => {
  const errors = handleValidationErrors(req, next);
  if (errors) return;

  const { otp } = req.body;
  const userId = req.userData?.userId;

  try {
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return next(new HttpError("User not found! Please sign up again.", 404));
    }

    if (
      !existingUser.emailVerificationToken ||
      !existingUser.emailVerificationTokenCreatedAt
    ) {
      return next(
        new HttpError(
          "OTP verification was not requested. Please resend the OTP and try again.",
          400
        )
      );
    }

    if (existingUser.emailVerificationToken !== otp) {
      return next(new HttpError("Invalid OTP. Please try again.", 400));
    }

    const tokenExpirationTime = new Date(
      existingUser.emailVerificationTokenCreatedAt.getTime() +
        EMAIL_VERIFICATION_OTP_EXPIRY * 60 * 1000
    );
    const currentTime = new Date();

    if (currentTime > tokenExpirationTime) {
      return next(
        new HttpError("The OTP has expired. Please request a new one.", 410)
      );
    }

    existingUser.isEmailVerified = true;
    existingUser.expireAt = undefined;
    existingUser.emailVerificationToken = undefined;
    existingUser.emailVerificationTokenCreatedAt = undefined;
    await existingUser.save();

    if (isDirect) return;

    res.status(200).json({ message: "Your email has been successfully verified." });
    return;
  } catch (error) {
    return next(new HttpError("An unexpected error occurred. Please try again later.", 500));
  }
};
