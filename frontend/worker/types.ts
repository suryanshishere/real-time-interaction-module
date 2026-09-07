export interface Env {
  DB: D1Database;
  POLL_ROOMS: DurableObjectNamespace;
  GOOGLE_CLIENT_ID: string;
  SESSION_SECRET: string;
}

export interface SessionUser {
  id: string;
  googleSub: string;
  email: string;
  name: string | null;
  deactivatedAt: string | null;
}

export interface PollRecord {
  id: string;
  sessionCode: string;
  question: string;
  options: string[];
  votes: number[];
  createdAt: string;
  createdBy: { name: string | null; email: string };
}
