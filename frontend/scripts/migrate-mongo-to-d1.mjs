import { MongoClient } from "mongodb";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(".migration");
const chunkSize = 250;

function sql(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  if (value instanceof Date) value = value.toISOString();
  return `'${String(value).replaceAll("'", "''")}'`;
}

function id(value) {
  return value?.toHexString?.() || String(value || "");
}

function date(value, fallback = new Date(0)) {
  const parsed = value ? new Date(value) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

function assertUnique(items, label, keyOf) {
  const seen = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!key) continue;
    if (seen.has(key)) throw new Error(`Duplicate ${label}: ${key}`);
    seen.set(key, true);
  }
}

async function readApprovedLinks() {
  const filename = process.env.LEGACY_GOOGLE_LINKS_FILE;
  if (!filename) return [];
  const parsed = JSON.parse(await readFile(path.resolve(filename), "utf8"));
  if (!Array.isArray(parsed)) throw new Error("LEGACY_GOOGLE_LINKS_FILE must contain a JSON array.");
  return parsed.map((entry) => ({
    legacyUserId: String(entry.legacyUserId || ""),
    googleEmail: String(entry.googleEmail || "").trim().toLowerCase(),
  }));
}

async function writeChunks(groups) {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const files = [];
  let sequence = 1;
  for (const [groupName, statements] of groups) {
    for (let offset = 0; offset < statements.length; offset += chunkSize) {
      const filename = `${String(sequence).padStart(4, "0")}-${groupName}.sql`;
      const contents = ["PRAGMA foreign_keys = ON;", ...statements.slice(offset, offset + chunkSize), ""].join("\n");
      await writeFile(path.join(outputDirectory, filename), contents, "utf8");
      files.push(filename);
      sequence += 1;
    }
  }
  return files;
}

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("Set MONGO_URI before running npm run data:export.");

const client = new MongoClient(mongoUri);
try {
  await client.connect();
  const database = process.env.MONGO_DB_NAME ? client.db(process.env.MONGO_DB_NAME) : client.db();
  const [users, polls, approvedLinks] = await Promise.all([
    database.collection("users").find({}).toArray(),
    database.collection("polls").find({}).toArray(),
    readApprovedLinks(),
  ]);

  const identityAddresses = users.flatMap((user) => [
    { userId: id(user._id), email: String(user.email || "").trim().toLowerCase() },
    ...(user.secondary_email
      ? [{ userId: id(user._id), email: String(user.secondary_email).trim().toLowerCase() }]
      : []),
  ]);
  assertUnique(identityAddresses, "user email", (entry) => entry.email);
  assertUnique(polls, "session code", (poll) => String(poll.sessionCode || "").trim().toUpperCase());
  const userIds = new Set(users.map((user) => id(user._id)));
  const emailsByUserId = new Map(
    users.map((user) => [
      id(user._id),
      new Set(
        [user.email, user.secondary_email]
          .filter(Boolean)
          .map((email) => String(email).trim().toLowerCase()),
      ),
    ]),
  );

  const userStatements = users.map((user) => {
    const userId = id(user._id);
    const email = String(user.email || "").trim().toLowerCase();
    if (!userId || !email) throw new Error(`User is missing id/email: ${JSON.stringify(user._id)}`);
    return `INSERT INTO users (id, google_sub, primary_email, secondary_email, name, deactivated_at, created_at, updated_at) VALUES (${sql(userId)}, NULL, ${sql(email)}, ${sql(user.secondary_email ? String(user.secondary_email).trim().toLowerCase() : null)}, ${sql(user.name || null)}, ${sql(user.deactivated_at ? date(user.deactivated_at) : null)}, ${sql(date(user.createdAt))}, ${sql(date(user.updatedAt || user.createdAt))});`;
  });

  const linkStatements = approvedLinks.map((link) => {
    if (
      !userIds.has(link.legacyUserId) ||
      !link.googleEmail.includes("@") ||
      !emailsByUserId.get(link.legacyUserId)?.has(link.googleEmail)
    ) {
      throw new Error(`Invalid legacy Google link: ${JSON.stringify(link)}`);
    }
    return `INSERT INTO legacy_google_links (legacy_user_id, approved_google_email) VALUES (${sql(link.legacyUserId)}, ${sql(link.googleEmail)});`;
  });

  const pollStatements = [];
  const voteStatements = [];
  let historicalVoteRecords = 0;
  let pollOptions = 0;
  let totalVoteCount = 0;
  for (const poll of polls) {
    const pollId = id(poll._id);
    const creatorId = id(poll.createdBy);
    const sessionCode = String(poll.sessionCode || "").trim().toUpperCase();
    if (!pollId || !userIds.has(creatorId) || !sessionCode || !poll.question) {
      throw new Error(`Poll ${pollId || "<unknown>"} has invalid ownership or required data.`);
    }
    const options = Array.isArray(poll.options) ? poll.options : [];
    const totals = Array.isArray(poll.votes) ? poll.votes : [];
    if (options.length < 2) throw new Error(`Poll ${pollId} has fewer than two options.`);
    pollStatements.push(`INSERT INTO polls (id, session_code, question, created_by, created_at) VALUES (${sql(pollId)}, ${sql(sessionCode)}, ${sql(String(poll.question))}, ${sql(creatorId)}, ${sql(date(poll.createdAt))});`);
    options.forEach((option, optionIndex) => {
      const total = Number.isSafeInteger(totals[optionIndex]) && totals[optionIndex] >= 0 ? totals[optionIndex] : 0;
      pollOptions += 1;
      totalVoteCount += total;
      pollStatements.push(`INSERT INTO poll_options (poll_id, option_index, label, vote_count) VALUES (${sql(pollId)}, ${optionIndex}, ${sql(String(option))}, ${total});`);
    });
    const seenVoters = new Set();
    for (const legacyVote of Array.isArray(poll.votesByUser) ? poll.votesByUser : []) {
      const voterId = id(legacyVote.userId);
      const optionIndex = Number(legacyVote.optionIndex);
      if (!userIds.has(voterId) || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length || seenVoters.has(voterId)) continue;
      seenVoters.add(voterId);
      historicalVoteRecords += 1;
      voteStatements.push(`INSERT INTO votes (id, poll_id, user_id, option_index, created_at) VALUES (${sql(`${pollId}:${voterId}`)}, ${sql(pollId)}, ${sql(voterId)}, ${optionIndex}, ${sql(date(poll.updatedAt || poll.createdAt))});`);
    }
  }

  const files = await writeChunks([
    ["users", userStatements], ["legacy-links", linkStatements],
    ["polls", pollStatements], ["votes", voteStatements],
  ]);
  const manifest = {
    generatedAt: new Date().toISOString(),
    database: database.databaseName,
    counts: {
      users: users.length,
      polls: polls.length,
      pollOptions,
      totalVoteCount,
      historicalVoteRecords,
      approvedLegacyLinks: approvedLinks.length,
    },
    files,
  };
  await writeFile(path.join(outputDirectory, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(manifest, null, 2));
  console.log("No password hashes, OTPs, reset tokens, or SMTP secrets were exported.");
} finally {
  await client.close();
}
