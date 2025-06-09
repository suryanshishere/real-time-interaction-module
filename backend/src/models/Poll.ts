// --- src/models/Poll.ts ---
import mongoose, { Schema, Document } from "mongoose";

export interface IPoll extends Document {
  sessionCode: string;
  question: string;
  options: string[];
  votes: number[];
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;

  // ⬇️ add this:
  votesByUser: { userId: mongoose.Types.ObjectId; optionIndex: number }[];
}

const PollSchema = new Schema<IPoll>({
  sessionCode: { type: String, required: true, unique: true },
  question:    { type: String, required: true },
  options:     [{ type: String, required: true }],
  votes:       [{ type: Number, default: 0 }],
  createdAt:   { type: Date, default: Date.now },
  createdBy:   { type: Schema.Types.ObjectId, ref: "User", required: true },

  // ⬇️ add this block to the schema:
  votesByUser: [
    {
      userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
      optionIndex: { type: Number, required: true },
    },
  ],
});

// Now when you import this file, `poll.votesByUser` will exist.
export default mongoose.model<IPoll>("Poll", PollSchema);
