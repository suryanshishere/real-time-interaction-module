import express, { NextFunction, Request, Response } from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import pollRoutes from "./routes/pollRoutes.js";
import initSocket from "./services/socketService.js";
import { Server as SocketIOServer } from "socket.io";
import checkAuth from "./middleware/check-auth.js";
import cookieParser from "cookie-parser";
import HttpError from "./utils/http-errors.js";
import authRoutes from "./routes/auth/auth-routes.js";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: [
      `${process.env.FRONTEND_URL}`,
      "https://pollbuzz.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(checkAuth);

await mongoose.connect(process.env.MONGO_URI!);

app.use("/auth", authRoutes)
app.use("/api/poll", pollRoutes);

//logout route
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.clearCookie("tokenExpiration");
  res.status(200).json({ message: "Logged out successfully" });
});

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });
initSocket(io);

//Error showing if none of the routes found!
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new HttpError("Could not find this route.", 404));
});

//httperror middleware use here to return a valid json error instead any html error page
app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.code || 500;
  const errorMessage = error.message || "An unknown error occurred!";

  const response = {
    message: errorMessage,
    ...(error.extraData && { extraData: error.extraData }),
  };

  res.status(statusCode).json(response);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
