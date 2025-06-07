import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import pollRoutes from './routes/pollRoutes.js';
import initSocket from './services/socketService.js';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

await mongoose.connect(process.env.MONGO_URI!);

app.use('/api/poll', pollRoutes);

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });
initSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
