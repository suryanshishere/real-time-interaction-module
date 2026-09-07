import type { GoogleIdentity } from "./auth";
import type { PollRecord, SessionUser } from "./types";

interface UserRow {
  id: string;
  google_sub: string | null;
  primary_email: string;
  name: string | null;
  deactivated_at: string | null;
}

interface PollRow {
  id: string;
  session_code: string;
  question: string;
  created_at: string;
  creator_name: string | null;
  creator_email: string;
}

export class GoogleLinkApprovalRequiredError extends Error {
  constructor() {
    super("This legacy account needs an approved Google account mapping.");
    this.name = "GoogleLinkApprovalRequiredError";
  }
}

function toSessionUser(row: UserRow): SessionUser {
  if (!row.google_sub) throw new Error("Google identity was not linked.");
  return {
    id: row.id,
    googleSub: row.google_sub,
    email: row.primary_email,
    name: row.name,
    deactivatedAt: row.deactivated_at,
  };
}

export async function findOrCreateGoogleUser(
  db: D1Database,
  identity: GoogleIdentity,
): Promise<SessionUser> {
  const linked = await db
    .prepare(
      "SELECT id, google_sub, primary_email, name, deactivated_at FROM users WHERE google_sub = ?",
    )
    .bind(identity.sub)
    .first<UserRow>();
  if (linked) return toSessionUser(linked);

  const legacy = await db
    .prepare(
      `SELECT id, google_sub, primary_email, name, deactivated_at
       FROM users
       WHERE primary_email = ? COLLATE NOCASE OR secondary_email = ? COLLATE NOCASE
       LIMIT 1`,
    )
    .bind(identity.email, identity.email)
    .first<UserRow>();

  if (legacy) {
    const googleIsAuthoritative =
      identity.email.endsWith("@gmail.com") || Boolean(identity.hostedDomain);
    const approved = googleIsAuthoritative
      ? true
      : Boolean(
          await db
            .prepare(
              `SELECT 1 FROM legacy_google_links
               WHERE legacy_user_id = ? AND approved_google_email = ? COLLATE NOCASE`,
            )
            .bind(legacy.id, identity.email)
            .first(),
        );

    if (approved) {
      await db
        .prepare(
          `UPDATE users SET google_sub = ?, name = COALESCE(?, name), updated_at = ?
           WHERE id = ?`,
        )
        .bind(identity.sub, identity.name, new Date().toISOString(), legacy.id)
        .run();
      return toSessionUser({ ...legacy, google_sub: identity.sub, name: identity.name ?? legacy.name });
    }

    // A non-Gmail address is not authoritative proof that the Google identity
    // owns an existing legacy account. Do not silently create a second account
    // with the same address or link it without an operator-approved mapping.
    throw new GoogleLinkApprovalRequiredError();
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO users (id, google_sub, primary_email, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, identity.sub, identity.email, identity.name, now, now)
    .run();
  return {
    id,
    googleSub: identity.sub,
    email: identity.email,
    name: identity.name,
    deactivatedAt: null,
  };
}

function generateSessionCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function pollFromRow(db: D1Database, row: PollRow): Promise<PollRecord> {
  const options = await db
    .prepare(
      `SELECT label, vote_count FROM poll_options
       WHERE poll_id = ? ORDER BY option_index ASC`,
    )
    .bind(row.id)
    .all<{ label: string; vote_count: number }>();
  return {
    id: row.id,
    sessionCode: row.session_code,
    question: row.question,
    options: options.results.map((option) => option.label),
    votes: options.results.map((option) => option.vote_count),
    createdAt: row.created_at,
    createdBy: { name: row.creator_name, email: row.creator_email },
  };
}

export async function getPoll(
  db: D1Database,
  sessionCode: string,
): Promise<PollRecord | null> {
  const row = await db
    .prepare(
      `SELECT p.id, p.session_code, p.question, p.created_at,
              u.name AS creator_name, u.primary_email AS creator_email
       FROM polls p JOIN users u ON u.id = p.created_by
       WHERE p.session_code = ?`,
    )
    .bind(sessionCode.toUpperCase())
    .first<PollRow>();
  return row ? pollFromRow(db, row) : null;
}

export async function createPoll(
  db: D1Database,
  userId: string,
  question: string,
  options: string[],
): Promise<PollRecord> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomUUID();
    const sessionCode = generateSessionCode();
    const createdAt = new Date().toISOString();
    const statements = [
      db
        .prepare(
          "INSERT INTO polls (id, session_code, question, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(id, sessionCode, question, userId, createdAt),
      ...options.map((label, optionIndex) =>
        db
          .prepare(
            "INSERT INTO poll_options (poll_id, option_index, label, vote_count) VALUES (?, ?, ?, 0)",
          )
          .bind(id, optionIndex, label),
      ),
    ];
    try {
      await db.batch(statements);
      const poll = await getPoll(db, sessionCode);
      if (!poll) throw new Error("Created poll could not be read.");
      return poll;
    } catch (error) {
      if (!String(error).toLowerCase().includes("unique")) throw error;
    }
  }
  throw new Error("Could not allocate a unique session code.");
}

export async function getUserPolls(
  db: D1Database,
  userId: string,
): Promise<PollRecord[]> {
  const rows = await db
    .prepare(
      `SELECT p.id, p.session_code, p.question, p.created_at,
              u.name AS creator_name, u.primary_email AS creator_email
       FROM polls p JOIN users u ON u.id = p.created_by
       WHERE p.created_by = ? ORDER BY p.created_at DESC`,
    )
    .bind(userId)
    .all<PollRow>();
  return Promise.all(rows.results.map((row) => pollFromRow(db, row)));
}
