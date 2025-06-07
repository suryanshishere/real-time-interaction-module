import { Request, Response } from "express";
import Poll, { IPoll } from "../models/Poll.js";
import { nanoid } from "nanoid";

export const createPoll = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { question, options } = req.body;
  const sessionCode = nanoid(6).toUpperCase();
  const poll = new Poll({
    sessionCode,
    question,
    options,
    votes: options.map(() => 0),
  });
  await poll.save();
  res.status(201).json(poll);
};

export const getPoll = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;
  const poll = await Poll.findOne({ sessionCode: code });
  if (!poll) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(poll);
};

export const vote = async (
  io: any,
  code: string,
  optionIndex: number
): Promise<void> => {
  const poll = await Poll.findOne({ sessionCode: code });
  if (!poll) return;
  poll.votes[optionIndex]++;
  await poll.save();
  io.in(code).emit("voteUpdate", poll.votes);
};
