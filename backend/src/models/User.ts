import _ from "lodash";
import mongoose, { Schema, Document } from "mongoose";

const MIN_EMAIL_OTP = 100000;
const MAX_EMAIL_OTP = 999999;
const OTP_ERROR_MSG = "OTP must be a 6-digit number.";
const PWD_RESET_ERROR_MSG = "Password reset token must be a 6-digit number.";

export interface IUser extends Document {
  // Authentication and verification fields
  isEmailVerified: boolean;
  google_only: boolean;
  name?: string;

  emailVerificationToken?: number;
  emailVerificationTokenCreatedAt?: Date;
  passwordResetToken?: number;
  passwordResetTokenCreatedAt?: Date;
  passwordChangedAt?: Date;

  // User identification fields
  email: string;
  secondary_email: string | null;
  password: string;

  deactivated_at?: Date; // Field to mark if user is deactivated

  expireAt?: Date;
}

const userSchema: Schema = new Schema<IUser>(
  {
    isEmailVerified: { type: Boolean, default: false },
    google_only: { type: Boolean, default: false },
    name: { type: String },
    emailVerificationToken: {
      type: Number,
      min: [MIN_EMAIL_OTP, OTP_ERROR_MSG],
      max: [MAX_EMAIL_OTP, OTP_ERROR_MSG],
    },
    emailVerificationTokenCreatedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: Number,
      min: [MIN_EMAIL_OTP, PWD_RESET_ERROR_MSG],
      max: [MAX_EMAIL_OTP, PWD_RESET_ERROR_MSG],
    },
    passwordResetTokenCreatedAt: {
      type: Date,
    },
    passwordChangedAt: { type: Date }, //todo

    // User identification fields
    email: { type: String, required: true, unique: true },
    secondary_email: { type: String, unique: true, sparse: true }, //if null, means there was secondary email earlier more checks can be done TODO
    password: { type: String, required: true },

    deactivated_at: { type: Date }, // Field to mark if user is deactivated

    // Field to auto-delete unverified users
    expireAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
