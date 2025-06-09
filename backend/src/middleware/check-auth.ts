import HttpError from "@utils/http-errors";
import { Response, NextFunction, Request } from "express";
import { expressjwt } from "express-jwt";
import { isRegExp } from "lodash";
import { getTokenFromRequest } from "@utils/verify-token";

// Define paths that do not require authorization (excluded routes)
export const excludedPaths: (string | RegExp)[] = [
  "/",
  "/auth",
  "/auth/reset-password",
  /^\/auth\/reset-password\/[^/]+$/, //TODO: regex can be used to add check for mongodb id
];

// Define paths that optionally require authorization (only if token is present)
export const optionalPaths: (string | RegExp)[] = [
  "/",
  "/auth/send-password-reset-link",
  "/auth/send-verification-otp",
];

const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  const checkAuth = expressjwt({
    secret: process.env.JWT_KEY ?? "",
    algorithms: ["HS256"],
    requestProperty: "userData", // attaches `req.userData`
    credentialsRequired: true,
    getToken: (req) => {
      const token = getTokenFromRequest(req);
      return token === null ? undefined : token;
    },
  }).unless({
    path: excludedPaths,
  });

  checkAuth(req, res, (err: any) => {
    if (err) {
      const isOptionalRoute = optionalPaths.some((path) => {
        if (isRegExp(path)) {
          return path.test(req.path);
        } else if (typeof path === "string") {
          return req.path === path;
        }
        return false;
      });

      // Handle unauthorized errors for non-optional routes
      if (err.name === "UnauthorizedError" && !isOptionalRoute) {
        return next(
          new HttpError("Unauthorized user, please do login / signup!", 401)
        );
      }
    }
    next();
  });
};

export default checkAuth;
