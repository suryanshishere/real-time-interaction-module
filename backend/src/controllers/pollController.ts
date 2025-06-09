import { Request, Response } from "express";
import Poll from "@models/Poll";
import { generateSessionCode } from "./utils";
import mongoose from "mongoose";
import User from "@models/User";
import { Server, Socket } from "socket.io";

export const createPoll = async (
  req: Request,
  res: Response
): Promise<void> => {
  // --- 1. Check authentication ---
  const userId = (req as any).userData.userId as string | undefined;
  if (!userId) {
    res
      .status(401)
      .json({ error: "User seems unauthenticated. Please log in." });
    return;
  }

  const { question, options } = req.body;
  if (
    !question ||
    !Array.isArray(options) ||
    options.length < 2 ||
    options.some((opt) => typeof opt !== "string" || opt.trim() === "")
  ) {
    res.status(400).json({
      error:
        "Invalid payload. `question` must be a non-empty string and `options` an array of at least two non-empty strings.",
    });
    return;
  }

  try {
    // --- 2. Generate unique session code & instantiate Poll ---
    const sessionCode = generateSessionCode(6);
    const poll = new Poll({
      sessionCode,
      question: question.trim(),
      options: options.map((opt: string) => opt.trim()),
      votes: options.map(() => 0),
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    // --- 3. Save Poll ---
    await poll.save();

    // --- 4. Link Poll to User ---
    await User.findByIdAndUpdate(userId, {
      $push: {
        pollsCreated: { poll: poll._id, createdAt: poll.createdAt },
      },
    });

    // --- 5. Return success ---
    res.status(201).json(poll);
  } catch (err: any) {
    console.error("createPoll error:", err);

    // Duplicate sessionCode → retrying is an option, but for now:
    if (err.code === 11000 && err.keyPattern?.sessionCode) {
      res
        .status(409)
        .json({ error: "Session code collision. Please try again." });
      return;
    }

    // Validation errors
    if (err.name === "ValidationError") {
      res.status(400).json({ error: err.message });
      return;
    }

    // Fallback
    res.status(500).json({ error: "Internal server error. Please try later." });
  }
};

export const getPoll = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;

  if (!code || typeof code !== "string" || code.trim() === "") {
    res
      .status(400)
      .json({ error: "Invalid session code. Please provide a valid code." });
    return;
  }

  try {
    const poll = await Poll.findOne({ sessionCode: code.trim() })
      .populate("createdBy", "name email")
      .lean(); // lean() gives you a plain JS object

    if (!poll) {
      res.status(404).json({ error: "Poll not found for that session code." });
      return;
    }

    const { _id, __v, ...publicPoll } = poll as any;

    res.status(200).json(publicPoll);
  } catch (err: any) {
    console.error("getPoll error:", err);
    res.status(500).json({
      error: "Something went wrong fetching the poll. Please try again later.",
    });
  }
};

export const vote = async (
  io: Server,
  socket: Socket,
  sessionCode: string,
  optionIndex: number
): Promise<void> => {
  const userIdStr = socket.data.user?.userId as string | undefined;

  if (!userIdStr) {
    socket.emit("voteError", "You must be logged in to vote.");
    return;
  }

  const userId = new mongoose.Types.ObjectId(userIdStr);

  try {
    const poll = await Poll.findOne({ sessionCode });

    if (!poll) {
      socket.emit("voteError", "Poll not found.");
      return;
    }

    // Optional: Check if poll is expired (if you have an expiration logic)
    // if (poll.expiresAt && poll.expiresAt < new Date()) {
    //   socket.emit("voteError", "Voting time is over for this poll.");
    //   return;
    // }

    if (
      typeof optionIndex !== "number" ||
      optionIndex < 0 ||
      optionIndex >= poll.options.length
    ) {
      socket.emit("voteError", "Invalid option selected.");
      return;
    }

    if (poll.votesByUser.some((v) => v.userId.equals(userId))) {
      socket.emit("voteError", "You have already voted in this poll.");
      return;
    }

    poll.votes[optionIndex] += 1;
    poll.votesByUser.push({ userId, optionIndex });

    await poll.save();

    io.in(sessionCode).emit("voteUpdate", poll.votes);
    socket.emit("voteSuccess", "Vote cast successfully.");
  } catch (err) {
    console.error("vote error:", err);
    socket.emit("voteError", "Something went wrong. Please try again later.");
  }
};
