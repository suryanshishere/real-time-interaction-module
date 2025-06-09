import { Request } from "express";
import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

export function extractTokenFromCookieString(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="))
    ?.split("=")[1] ?? null;
}

export function verifyJwtToken(token: string) {
  return jwt.verify(token, process.env.JWT_KEY!, { algorithms: ["HS256"] });
}

// for Express:
export function getTokenFromRequest(req: Request): string | null {
  return req.cookies?.token ?? null;
}

// for Socket.IO handshake:
export function getTokenFromSocket(socket: Socket): string | null {
  return extractTokenFromCookieString(socket.handshake.headers.cookie);
}