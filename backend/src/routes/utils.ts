import { check } from "express-validator";
import _ from "lodash";

const MIN_PWD_LENGTH = 8;
const MAX_PWD_LENGTH = 64;
const MIN_EMAIL_OTP = 100000;
const MAX_EMAIL_OTP = 999999;
const OTP_ERROR_MSG = `OTP must be a ${MIN_EMAIL_OTP}-${MAX_EMAIL_OTP} number.`;

export const validatePassword = (
  field: string = "password",
  optional: boolean = false
) => {
  const friendlyName = _.startCase(_.toLower(field));

  let chain = check(field);
  if (optional) {
    chain = chain.optional({ nullable: true, checkFalsy: true });
  }

  return chain
    .if((value, { req }) => !req.body.google_token)
    .trim()
    .isLength({
      min: MIN_PWD_LENGTH,
      max: MAX_PWD_LENGTH,
    })
    .withMessage(
      `${friendlyName} must be between ${MIN_PWD_LENGTH} and ${MAX_PWD_LENGTH} characters.`
    );
};

export const validateEmail = (
  field: string = "email",
  optional: boolean = false
) => {
  const friendlyName = _.startCase(_.toLower(field));

  let chain = check(field);
  if (optional) {
    chain = chain.optional({ nullable: true, checkFalsy: true });
  }

  return chain
    .if((value, { req }) => !req.body.google_token)
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage(`Invalid ${friendlyName}!`);
};

export const validateOTP = (
  field: string = "otp",
  optional: boolean = false
) => {
  let chain = check(field);
  if (optional) {
    chain = chain.optional({ nullable: true, checkFalsy: true });
  }

  return chain
    .isInt({ min: MIN_EMAIL_OTP, max: MAX_EMAIL_OTP })
    .withMessage(OTP_ERROR_MSG);
};
