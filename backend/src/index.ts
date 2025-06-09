import "module-alias/register";
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import pollRoutes from "./routes/pollRoutes";
import authRoutes from "./routes/auth/auth-routes";
import initSocket from "./services/socketService";
import checkAuth from "./middleware/check-auth";
import HttpError from "./utils/http-errors";
import bodyParser from "body-parser";
import { getUserCreatedPolls } from "@controllers/userController";

// Load environment variables
dotenv.config();

// --- Validate required environment variables ---
const { MONGO_URI, JWT_KEY, FRONTEND_URL, PORT } = process.env;

if (!MONGO_URI || !JWT_KEY || !FRONTEND_URL) {
  console.error(
    "Missing required environment variables (MONGO_URI, JWT_KEY, FRONTEND_URL)"
  );
  process.exit(1);
}

// --- Express app setup ---
const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

// --- CORS ---
app.use(
  cors({
    origin: [
      FRONTEND_URL,
      "https://pollbuzz.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// --- Apply JWT Middleware ---
app.use(checkAuth);

// --- Routes ---
app.use("/auth", authRoutes);
app.use("/poll", pollRoutes);
app.get("/my-polls", getUserCreatedPolls);

// --- Logout route ---
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.clearCookie("tokenExpiration");
  res.status(200).json({ message: "Logged out successfully" });
});

// --- 404 Fallback ---
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new HttpError("Could not find this route.", 404));
});

// --- Global Error Handler ---
app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.code || 500;
  const errorMessage = error.message || "An unknown error occurred!";
  const response = {
    message: errorMessage,
    ...(error.extraData && { extraData: error.extraData }),
  };
  res.status(statusCode).json(response);
});

// --- Server Setup ---
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [ FRONTEND_URL, "https://pollbuzz.vercel.app", "http://localhost:3000" ],
    methods: ["GET", "POST"],
    credentials: true
  },
});

initSocket(io);

// --- Connect MongoDB and Start Server ---
(async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const port = PORT || 4000;
    server.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
})();
