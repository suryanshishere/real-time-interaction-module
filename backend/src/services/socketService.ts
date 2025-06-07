import { Server } from 'socket.io';
import { vote } from '../controllers/pollController.js';

export default function initSocket(io: Server) {
  io.on('connection', (socket) => {
    socket.on('join', (code: string) => {
      socket.join(code);
    });

    socket.on('castVote', ({ code, optionIndex }) => {
      vote(io, code, optionIndex);
    });
  });
}