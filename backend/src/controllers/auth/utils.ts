import { IUser } from "@models/User";
import { sendVerificationOtp } from "./index";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextFunction, Response, Request } from "express";
import lodash from "lodash";
const { random } = lodash;

// Update unverified user fields with new password and verification token
export const updateUnverifiedUser = async (user: IUser, password: string) => {
  user.password = await bcrypt.hash(password, 12);
  user.emailVerificationToken = random(100000, 999999);
  user.emailVerificationTokenCreatedAt = new Date();
  await user.save();
};

// Send verification response with token and expiration
export const sendVerificationResponse = async (
  req: Request,
  res: Response,
  next: NextFunction,
  user: IUser
): Promise<void> => {
  const options = {
    userId: user.id,
    email: user.email,
    token: user.emailVerificationToken,
    isDirect: true,
  };

  await sendVerificationOtp(req, res, next, options);

  sendAuthenticatedResponse(res, user, false);
  return;
};

export const generateJWTToken = (
  userId: string,
  email: string,
  role: string = "none",
  deactivatedAt?: Date
): string => {
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY environment variable is not defined!");
  }

  const payload = {
    userId,
    email,
    role,
    ...(deactivatedAt && { deactivated_at: deactivatedAt }),
  };

  const jwtKeyExpiryStr = process.env.JWT_KEY_EXPIRY || "15";
  const jwtKeyExpiry = parseInt(jwtKeyExpiryStr, 10);
  const jwtKey = process.env.JWT_KEY || "";

  return jwt.sign(payload, jwtKey, {
    expiresIn: `${jwtKeyExpiry}m`,
  });
};

// Revised checkRequestDelay function
export const checkRequestDelay = (
  tokenCreatedAt: Date | null | undefined,
  delayInSeconds: number
): number | null => {
  if (!tokenCreatedAt || isNaN(tokenCreatedAt.getTime())) {
    return null;
  }
  if (tokenCreatedAt > new Date()) {
    return null;
  }
  const timeElapsed = Date.now() - tokenCreatedAt.getTime();
  const delayInMilliseconds = delayInSeconds * 1000;

  if (timeElapsed < delayInMilliseconds) {
    return Math.ceil((delayInMilliseconds - timeElapsed) / 1000);
  }

  return null;
};

// Send authenticated response for verified users
export const sendAuthenticatedResponse = (
  res: Response,
  user: IUser,
  isEmailVerified: boolean = true,
  secondaryEmail: boolean = false
): void => {
  const token = generateJWTToken(
    user.id,
    user.email,
    "none",
    user.deactivated_at
  );
  const jwtKeyExpiry = process.env.JWT_KEY_EXPIRY || "60";
  const expiresInMs = Number(jwtKeyExpiry) * 60000;
  const tokenExpiration = new Date(Date.now() + expiresInMs);

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
   sameSite: isProduction ? "none" : "lax",
    expires: tokenExpiration,
  });

  res.cookie("tokenExpiration", tokenExpiration.toISOString(), {
    secure: isProduction,
   sameSite: isProduction ? "none" : "lax",
    expires: tokenExpiration,
  });

  res.status(200).json({
    isEmailVerified,
    deactivated_at: user.deactivated_at ?? null,
    message: secondaryEmail
      ? "Logged in through secondary email successfully!"
      : isEmailVerified
      ? "Logged in successfully!"
      : "An OTP verification being sent to your mail.",
  });
  return;
};
