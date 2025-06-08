import express from "express";
import { check } from "express-validator";
const router = express.Router();

router.post(
  "/forgot-password",
  [check("email").trim().normalizeEmail().isEmail()],
  
);

router.post(
  "/reset-password",
  [
    check("email").trim().not().isEmpty(),
    check("otp").trim().isLength({ min: 6, max: 6 }).isNumeric(),
    check("password").trim().isLength({ min: 5 }),
  ],
  
);

router.post("/reset-password/timer");

export default router;
