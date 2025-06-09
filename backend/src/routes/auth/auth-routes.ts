import express from "express";
import { check } from "express-validator";
import {
  sendVerificationOtp,
  auth,
  verifyEmail,
  resetPassword,
  sendPasswordResetLink,
} from "../../controllers/auth/index";
import {
  validateEmail,
  validateOTP,
  validatePassword,
} from "../utils";

const router = express.Router();

router.post("/", [validateEmail(), validatePassword()], auth);

router.post(
  "/send-password-reset-link",
  validateEmail(),
  sendPasswordResetLink
);

router.post(
  "/reset-password",
  [
    check("resetPasswordToken")
      .isNumeric()
      .isLength({ min: 30, max: 30 })
      .withMessage("Reset password token must be a 30-digit number."),
    validatePassword(),
  ],
  resetPassword
);

//authenticated routes
router.post("/verify-email", validateOTP(), verifyEmail);

router.post("/send-verification-otp", sendVerificationOtp);

export default router;
