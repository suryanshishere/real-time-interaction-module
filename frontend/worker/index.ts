import { Hono } from "hono";
import {
  authenticateRequest,
  clearSessionCookie,
  createCsrfResponse,
  createSessionCookie,
  validateLoginRequest,
  verifyGoogleCredential,
} from "./auth";
import {
  createPoll,
  findOrCreateGoogleUser,
  GoogleLinkApprovalRequiredError,
  getPoll,
  getUserPolls,
} from "./database";
import { PollRoom } from "./poll-room";
import type { Env, SessionUser } from "./types";

type Variables = { user: SessionUser };
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

function apiError(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}

app.use("/api/*", async (context, next) => {
  await next();
  context.header("Cache-Control", "no-store");
  context.header("X-Content-Type-Options", "nosniff");
  context.header("Referrer-Policy", "strict-origin-when-cross-origin");
  context.header("X-Frame-Options", "DENY");
});

const requireUser = async (context: any, next: () => Promise<void>) => {
  const user = await authenticateRequest(context.req.raw, context.env);
  if (!user) return apiError("UNAUTHENTICATED", "Please sign in with Google.", 401);
  context.set("user", user);
  await next();
};

const requireActiveUser = async (context: any, next: () => Promise<void>) => {
  const user = await authenticateRequest(context.req.raw, context.env);
  if (!user) return apiError("UNAUTHENTICATED", "Please sign in with Google.", 401);
  const current = (await context.env.DB
    .prepare("SELECT deactivated_at FROM users WHERE id = ?")
    .bind(user.id)
    .first()) as { deactivated_at: string | null } | null;
  if (!current) return apiError("UNAUTHENTICATED", "Account no longer exists.", 401);
  if (current.deactivated_at) {
    return apiError("ACCOUNT_DEACTIVATED", "This account is deactivated.", 403);
  }
  context.set("user", { ...user, deactivatedAt: null });
  await next();
};

app.get("/api/auth/csrf", (context) => createCsrfResponse(context.req.raw));

app.get("/api/health", async (context) => {
  await context.env.DB.prepare("SELECT 1").first();
  return context.json({ status: "ok" });
});

app.post("/api/auth/google", async (context) => {
  if (!context.env.GOOGLE_CLIENT_ID || !context.env.SESSION_SECRET) {
    return apiError("SERVER_NOT_CONFIGURED", "Google login is not configured.", 503);
  }
  let body: { credential?: unknown; csrfToken?: unknown };
  try {
    body = await context.req.json();
  } catch {
    return apiError("INVALID_REQUEST", "Invalid login request.", 400);
  }
  if (!validateLoginRequest(context.req.raw, body.csrfToken)) {
    return apiError("INVALID_CSRF", "Login request expired. Please try again.", 403);
  }
  if (typeof body.credential !== "string") {
    return apiError("INVALID_GOOGLE_TOKEN", "Google did not return a credential.", 400);
  }
  try {
    const identity = await verifyGoogleCredential(body.credential, context.env);
    const user = await findOrCreateGoogleUser(context.env.DB, identity);
    const cookie = await createSessionCookie(context.req.raw, user, context.env);
    return Response.json(
      { user },
      { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Google login failed", error);
    if (error instanceof GoogleLinkApprovalRequiredError) {
      return apiError(
        "GOOGLE_LINK_APPROVAL_REQUIRED",
        "This existing account needs an approved Google account mapping. Contact the site owner.",
        409,
      );
    }
    return apiError("INVALID_GOOGLE_TOKEN", "Google login could not be verified.", 401);
  }
});

app.get("/api/session", async (context) => {
  const user = await authenticateRequest(context.req.raw, context.env);
  return context.json({ authenticated: Boolean(user), user });
});

app.post("/api/auth/logout", (context) =>
  Response.json(
    { message: "Logged out successfully." },
    { headers: { "Set-Cookie": clearSessionCookie(context.req.raw) } },
  ),
);

app.get("/api/polls/:code", async (context) => {
  const code = context.req.param("code").trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) {
    return apiError("INVALID_POLL_CODE", "Enter a valid six-character poll code.", 400);
  }
  const poll = await getPoll(context.env.DB, code);
  return poll
    ? context.json(poll)
    : apiError("POLL_NOT_FOUND", "Poll not found for that session code.", 404);
});

app.post("/api/polls", requireActiveUser, async (context) => {
  let body: { question?: unknown; options?: unknown };
  try {
    body = await context.req.json();
  } catch {
    return apiError("INVALID_REQUEST", "Invalid poll request.", 400);
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const options = Array.isArray(body.options)
    ? body.options
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
    : [];
  if (
    !question ||
    question.length > 500 ||
    options.length < 2 ||
    options.length > 7 ||
    options.some((option) => !option || option.length > 200) ||
    new Set(options.map((option) => option.toLowerCase())).size !== options.length
  ) {
    return apiError(
      "INVALID_POLL",
      "Use a question up to 500 characters and 2–7 distinct non-empty options up to 200 characters each.",
      400,
    );
  }
  try {
    const poll = await createPoll(context.env.DB, context.get("user").id, question, options);
    return context.json(poll, 201);
  } catch (error) {
    console.error("Poll creation failed", error);
    return apiError("POLL_CREATE_FAILED", "Poll could not be created. Please try again.", 500);
  }
});

app.get("/api/me/polls", requireUser, async (context) => {
  const polls = await getUserPolls(context.env.DB, context.get("user").id);
  return context.json(polls);
});

app.post("/api/polls/:code/votes", requireActiveUser, async (context) => {
  const code = context.req.param("code").trim().toUpperCase();
  let body: { optionIndex?: unknown };
  try {
    body = await context.req.json();
  } catch {
    return apiError("INVALID_OPTION", "Select a valid option.", 400);
  }
  const id = context.env.POLL_ROOMS.idFromName(code);
  const stub = context.env.POLL_ROOMS.get(id);
  return stub.fetch("https://poll-room/vote?code=" + encodeURIComponent(code), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: context.get("user").id, optionIndex: body.optionIndex }),
  });
});

app.get("/api/polls/:code/live", async (context) => {
  const code = context.req.param("code").trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(code)) {
    return apiError("INVALID_POLL_CODE", "Invalid poll code.", 400);
  }
  const id = context.env.POLL_ROOMS.idFromName(code);
  const stub = context.env.POLL_ROOMS.get(id);
  const request = new Request(
    "https://poll-room/live?code=" + encodeURIComponent(code),
    context.req.raw,
  );
  return stub.fetch(request);
});

app.notFound(() => apiError("NOT_FOUND", "API route not found.", 404));
app.onError((error) => {
  console.error("Unhandled Worker error", error);
  return apiError("INTERNAL_ERROR", "Something went wrong. Please try again later.", 500);
});

export { PollRoom };
export default app;
