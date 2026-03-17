import mongoose, { Document, Schema } from "mongoose";

export interface ISchedulerLogDocument extends Document {
  runAt: Date;
  status: "running" | "completed" | "failed";
  chaptersProcessed: number;
  questionsAdded: number;
  highYieldTopicsAdded: number;
  errorMessages: string[];
  durationMs: number;
  createdAt: Date;
}

const SchedulerLogSchema = new Schema<ISchedulerLogDocument>(
  {
    runAt: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },
    chaptersProcessed: { type: Number, default: 0 },
    questionsAdded: { type: Number, default: 0 },
    highYieldTopicsAdded: { type: Number, default: 0 },
    errorMessages: { type: [String], default: [] },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SchedulerLog =
  mongoose.models.SchedulerLog ||
  mongoose.model<ISchedulerLogDocument>("SchedulerLog", SchedulerLogSchema);

export default SchedulerLog;
