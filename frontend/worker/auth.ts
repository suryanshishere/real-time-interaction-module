import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import type { Env, SessionUser } from "./types";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const SESSION_COOKIE = "pollbuzz_session";
const CSRF_COOKIE = "pollbuzz_csrf";
const encoder = new TextEncoder();

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string | null;
  hostedDomain: string | null;
}

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function cookieAttributes(request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function publicCookieAttributes(request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let result = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    result |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return result === 0;
}

export function createCsrfResponse(request: Request): Response {
  const token = randomToken();
  return Response.json(
    { csrfToken: token },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": `${CSRF_COOKIE}=${encodeURIComponent(token)}; ${publicCookieAttributes(request, 600)}`,
      },
    },
  );
}

export function validateLoginRequest(
  request: Request,
  csrfToken: unknown,
): boolean {
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) return false;
  const cookieToken = readCookie(request, CSRF_COOKIE);
  return (
    typeof csrfToken === "string" &&
    csrfToken.length >= 32 &&
    cookieToken !== null &&
    constantTimeEqual(cookieToken, csrfToken)
  );
}

export async function verifyGoogleCredential(
  credential: string,
  env: Env,
): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
    audience: env.GOOGLE_CLIENT_ID,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true
  ) {
    throw new Error("Google account does not provide a verified email.");
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: typeof payload.name === "string" ? payload.name : null,
    hostedDomain: typeof payload.hd === "string" ? payload.hd : null,
  };
}

export async function createSessionCookie(
  request: Request,
  user: SessionUser,
  env: Env,
): Promise<string> {
  const token = await new SignJWT({
    uid: user.id,
    email: user.email,
    name: user.name,
    deactivatedAt: user.deactivatedAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.googleSub)
    .setIssuedAt()
    .setExpirationTime("1h")
    .setIssuer("pollbuzz")
    .setAudience("pollbuzz-web")
    .sign(encoder.encode(env.SESSION_SECRET));

  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieAttributes(request, 3600)}`;
}

export function clearSessionCookie(request: Request): string {
  return `${SESSION_COOKIE}=; ${cookieAttributes(request, 0)}`;
}

export async function authenticateRequest(
  request: Request,
  env: Env,
): Promise<SessionUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || !env.SESSION_SECRET) return null;

  try {
    const { payload } = await jwtVerify(token, encoder.encode(env.SESSION_SECRET), {
      algorithms: ["HS256"],
      issuer: "pollbuzz",
      audience: "pollbuzz-web",
    });
    if (typeof payload.sub !== "string" || typeof payload.uid !== "string") {
      return null;
    }
    return {
      id: payload.uid,
      googleSub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : null,
      deactivatedAt:
        typeof payload.deactivatedAt === "string" ? payload.deactivatedAt : null,
    };
  } catch {
    return null;
  }
}
