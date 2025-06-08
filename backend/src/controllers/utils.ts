import HttpError from "../utils/http-errors.js";
import { NextFunction, Request } from "express";
import { validationResult } from "express-validator";

const validationError = (errors: any): string => {
  const errorMessages = errors.array().map((error: { msg: string }) => error.msg);
  return errorMessages.length > 0
    ? errorMessages.join(" - ") // JOIN all messages with commas
    : "Invalid inputs!";
};

const handleValidationErrors = (req: Request, next: NextFunction): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = validationError(errors); // this will be one string
    next(new HttpError(message, 400)); // send it in HttpError
    return true;
  }
  return false;
};

export { handleValidationErrors };
