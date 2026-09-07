import { DurableObject } from "cloudflare:workers";
import type { Env } from "./types";

interface VoteBody {
  userId?: string;
  optionIndex?: number;
}

export class PollRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  private async currentVotes(code: string): Promise<number[] | null> {
    const rows = await this.env.DB
      .prepare(
        `SELECT po.vote_count FROM poll_options po
         JOIN polls p ON p.id = po.poll_id
         WHERE p.session_code = ? ORDER BY po.option_index ASC`,
      )
      .bind(code)
      .all<{ vote_count: number }>();
    return rows.results.length
      ? rows.results.map((row) => row.vote_count)
      : null;
  }

  private broadcast(votes: number[]): void {
    const message = JSON.stringify({ type: "poll.votes", votes });
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        socket.close(1011, "Broadcast failed");
      }
    }
  }

  private async connectWebSocket(request: Request, code: string): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return Response.json({ error: { code: "UPGRADE_REQUIRED", message: "WebSocket upgrade required." } }, { status: 426 });
    }
    const votes = await this.currentVotes(code);
    if (!votes) {
      return Response.json({ error: { code: "POLL_NOT_FOUND", message: "Poll not found." } }, { status: 404 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ code });
    server.send(JSON.stringify({ type: "poll.snapshot", votes }));
    return new Response(null, { status: 101, webSocket: client });
  }

  private async vote(request: Request, code: string): Promise<Response> {
    const body = (await request.json()) as VoteBody;
    if (!body.userId || !Number.isInteger(body.optionIndex)) {
      return Response.json({ error: { code: "INVALID_OPTION", message: "Select a valid option." } }, { status: 400 });
    }
    const option = await this.env.DB
      .prepare(
        `SELECT p.id AS poll_id FROM polls p JOIN poll_options po ON po.poll_id = p.id
         WHERE p.session_code = ? AND po.option_index = ?`,
      )
      .bind(code, body.optionIndex)
      .first<{ poll_id: string }>();
    if (!option) {
      return Response.json({ error: { code: "INVALID_OPTION", message: "Poll or option was not found." } }, { status: 400 });
    }

    try {
      await this.env.DB.batch([
        this.env.DB
          .prepare(
            "INSERT INTO votes (id, poll_id, user_id, option_index, created_at) VALUES (?, ?, ?, ?, ?)",
          )
          .bind(crypto.randomUUID(), option.poll_id, body.userId, body.optionIndex, new Date().toISOString()),
        this.env.DB
          .prepare(
            "UPDATE poll_options SET vote_count = vote_count + 1 WHERE poll_id = ? AND option_index = ?",
          )
          .bind(option.poll_id, body.optionIndex),
      ]);
    } catch (error) {
      if (String(error).toLowerCase().includes("unique")) {
        return Response.json({ error: { code: "ALREADY_VOTED", message: "You have already voted in this poll." } }, { status: 409 });
      }
      throw error;
    }
    const votes = await this.currentVotes(code);
    if (!votes) throw new Error("Poll disappeared after vote.");
    this.broadcast(votes);
    return Response.json({ message: "Vote cast successfully.", votes });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = (url.searchParams.get("code") || "").toUpperCase();
    if (!code) return new Response("Missing poll code", { status: 400 });
    if (url.pathname === "/live") return this.connectWebSocket(request, code);
    if (url.pathname === "/vote" && request.method === "POST") return this.vote(request, code);
    return new Response("Not found", { status: 404 });
  }

  webSocketMessage(_socket: WebSocket, _message: ArrayBuffer | string): void {
    // Clients receive snapshots and broadcasts; votes use authenticated HTTP.
  }

  webSocketClose(socket: WebSocket, code: number, reason: string): void {
    socket.close(code, reason);
  }
}
