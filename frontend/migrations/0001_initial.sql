PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  primary_email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  secondary_email TEXT COLLATE NOCASE UNIQUE,
  name TEXT,
  deactivated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE legacy_google_links (
  legacy_user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  approved_google_email TEXT NOT NULL COLLATE NOCASE UNIQUE
);

CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  session_code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  question TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);

CREATE TABLE poll_options (
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL CHECK(option_index >= 0),
  label TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0 CHECK(vote_count >= 0),
  PRIMARY KEY (poll_id, option_index)
);

CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  option_index INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (poll_id, user_id),
  FOREIGN KEY (poll_id, option_index)
    REFERENCES poll_options(poll_id, option_index) ON DELETE CASCADE
);

CREATE INDEX polls_created_by_created_at_idx ON polls(created_by, created_at DESC);
CREATE INDEX votes_poll_id_idx ON votes(poll_id);
