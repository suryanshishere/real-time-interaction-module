import { Server, Socket } from "socket.io";
import { vote } from "@controllers/pollController";
import { getTokenFromSocket, verifyJwtToken } from "@utils/verify-token";

export default function initSocket(io: Server) {
  // 👮‍♂️ Handshake‐level auth
  io.use((socket: Socket, next) => {
    const token = getTokenFromSocket(socket);
    if (!token) {
      return next(new Error("Authentication error: no token"));
    }
    try {
      const payload = verifyJwtToken(token);
      // attach to `socket.data` (recommended) or `socket.user`
      socket.data.user = payload;
      next();
    } catch (e) {
      return next(new Error("Authentication error: invalid token"));
    }
  });

  //  Now only authorized sockets get here
  io.on("connection", (socket: Socket) => {
    // you can read `socket.data.user` safely

    socket.on("join", (code: string) => {
      socket.join(code);
    });

    socket.on(
      "castVote",
      ({ code, optionIndex }: { code: string; optionIndex: number }) => {
        vote(io, socket, code, optionIndex);
      }
    );
  });
}
