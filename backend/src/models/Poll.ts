import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
  sessionCode: string;
  question: string;
  options: string[];
  votes: number[];
  createdAt: Date;
}

const PollSchema: Schema = new Schema({
  sessionCode: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  votes: [{ type: Number, default: 0 }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPoll>('Poll', PollSchema);