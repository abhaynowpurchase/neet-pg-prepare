import mongoose, { Document, Schema } from "mongoose";

export interface ICrawlerLogDocument extends Document {
  startedAt: Date;
  status: "running" | "idle" | "paused";
  passNumber: number;
  totalAdded: number;
  totalDuplicates: number;
  totalErrors: number;
  lastChapter?: string;
  lastExamType?: string;
  lastYear?: number;
  messages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CrawlerLogSchema = new Schema<ICrawlerLogDocument>(
  {
    startedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["running", "idle", "paused"], default: "running" },
    passNumber: { type: Number, default: 1 },
    totalAdded: { type: Number, default: 0 },
    totalDuplicates: { type: Number, default: 0 },
    totalErrors: { type: Number, default: 0 },
    lastChapter: String,
    lastExamType: String,
    lastYear: Number,
    messages: { type: [String], default: [] },
  },
  { timestamps: true }
);

CrawlerLogSchema.index({ createdAt: -1 });

const CrawlerLog =
  mongoose.models.CrawlerLog ||
  mongoose.model<ICrawlerLogDocument>("CrawlerLog", CrawlerLogSchema);

export default CrawlerLog;
