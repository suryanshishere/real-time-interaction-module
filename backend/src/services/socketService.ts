import { Server, Socket } from "socket.io";
import { vote } from "@controllers/pollController";
import { getTokenFromSocket, verifyJwtToken } from "@utils/verify-token";

export default function initSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    // No handshake-level auth: anyone can connect and join rooms

    socket.on("join", (code: string) => {
      socket.join(code);
      // Anyone can join to view poll results
    });

    socket.on(
      "castVote",
      ({ code, optionIndex }: { code: string; optionIndex: number }) => {
        // Get token from socket handshake or custom auth header in message
        const token = getTokenFromSocket(socket);

        if (!token) {
          socket.emit("voteError", "Authentication required to vote.");
          return;
        }

        try {
          const user = verifyJwtToken(token);
          // attach user to socket.data if you want
          socket.data.user = user;
        } catch {
          socket.emit("voteError", "Invalid authentication token.");
          return;
        }

        // Authorized — proceed with vote
        vote(io, socket, code, optionIndex);
      }
    );
  });
}
