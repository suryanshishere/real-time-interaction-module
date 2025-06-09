import { Request, Response } from "express";
import Poll from "@models/Poll";

export const getUserCreatedPolls = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userData.userId;
    console.log(userId)
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Fetch polls created by the user, sort newest first
    const polls = await Poll.find({ createdBy: userId })
      .select("sessionCode question options votes votesByUser createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(polls);
  } catch (error) {
    console.error("Error fetching user polls:", error);
    res.status(500).json({ message: "Server error" });
  }
};
