import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { D1Migration } from "@cloudflare/vitest-pool-workers";
import { createSessionCookie } from "../worker/auth";
import {
  findOrCreateGoogleUser,
  GoogleLinkApprovalRequiredError,
} from "../worker/database";
import type { Env as WorkerEnv, SessionUser } from "../worker/types";

declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

const user: SessionUser = {
  id: "user-1",
  googleSub: "google-1",
  email: "owner@gmail.com",
  name: "Poll Owner",
  deactivatedAt: null,
};

async function sessionCookie(): Promise<string> {
  const value = await createSessionCookie(new Request("http://localhost"), user, env);
  return value.split(";")[0];
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM votes"),
    env.DB.prepare("DELETE FROM poll_options"),
    env.DB.prepare("DELETE FROM polls"),
    env.DB.prepare("DELETE FROM legacy_google_links"),
    env.DB.prepare("DELETE FROM users"),
  ]);
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO users (id, google_sub, primary_email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(user.id, user.googleSub, user.email, user.name, now, now).run();
});

describe("PollBuzz Worker", () => {
  it("reports a healthy Worker and D1 binding", async () => {
    const response = await SELF.fetch("https://example.com/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("safely links a matching legacy Gmail account", async () => {
    const now = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO users (id, primary_email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind("legacy-gmail", "legacy@gmail.com", "Old Name", now, now).run();

    const linked = await findOrCreateGoogleUser(env.DB, {
      sub: "google-gmail",
      email: "legacy@gmail.com",
      name: "Google Name",
      hostedDomain: null,
    });

    expect(linked.id).toBe("legacy-gmail");
    expect(linked.googleSub).toBe("google-gmail");
  });

  it("requires approval before linking a legacy non-Gmail account", async () => {
    const now = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO users (id, primary_email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind("legacy-custom", "person@example.com", "Legacy User", now, now).run();

    await expect(
      findOrCreateGoogleUser(env.DB, {
        sub: "google-custom",
        email: "person@example.com",
        name: "Google User",
        hostedDomain: null,
      }),
    ).rejects.toBeInstanceOf(GoogleLinkApprovalRequiredError);

    await env.DB.prepare(
      "INSERT INTO legacy_google_links (legacy_user_id, approved_google_email) VALUES (?, ?)",
    ).bind("legacy-custom", "person@example.com").run();
    const linked = await findOrCreateGoogleUser(env.DB, {
      sub: "google-custom",
      email: "person@example.com",
      name: "Google User",
      hostedDomain: null,
    });
    expect(linked.id).toBe("legacy-custom");
  });

  it("rejects poll creation without a session", async () => {
    const response = await SELF.fetch("https://example.com/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Question?", options: ["A", "B"] }),
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });

  it("creates and publicly reads a poll", async () => {
    const created = await SELF.fetch("https://example.com/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: await sessionCookie() },
      body: JSON.stringify({ question: "Best option?", options: ["One", "Two"] }),
    });
    expect(created.status).toBe(201);
    const poll = await created.json<any>();
    expect(poll).toMatchObject({ question: "Best option?", votes: [0, 0] });

    const fetched = await SELF.fetch(`https://example.com/api/polls/${poll.sessionCode}`);
    expect(fetched.status).toBe(200);
    expect(await fetched.json()).toMatchObject({ sessionCode: poll.sessionCode });
  });

  it("commits one vote and rejects a duplicate", async () => {
    const cookie = await sessionCookie();
    const created = await SELF.fetch("https://example.com/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ question: "Choose", options: ["A", "B"] }),
    });
    const poll = await created.json<any>();
    const vote = () => SELF.fetch(`https://example.com/api/polls/${poll.sessionCode}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ optionIndex: 1 }),
    });
    const first = await vote();
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ votes: [0, 1] });
    const duplicate = await vote();
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({ error: { code: "ALREADY_VOTED" } });
  });

  it("blocks a deactivated user from writes", async () => {
    await env.DB.prepare("UPDATE users SET deactivated_at = ? WHERE id = ?").bind(new Date().toISOString(), user.id).run();
    const response = await SELF.fetch("https://example.com/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: await sessionCookie() },
      body: JSON.stringify({ question: "Question?", options: ["A", "B"] }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "ACCOUNT_DEACTIVATED" } });
  });
});
