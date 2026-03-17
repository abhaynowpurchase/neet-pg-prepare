import mongoose, { Document, Schema } from "mongoose";

export interface IUserProgressDocument extends Document {
  userId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  storyCompleted: boolean;
  quizScore?: number;
  questionsAttempted: number;
  questionsCorrect: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserProgressSchema = new Schema<IUserProgressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter ID is required"],
    },
    storyCompleted: {
      type: Boolean,
      default: false,
    },
    quizScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    questionsAttempted: {
      type: Number,
      default: 0,
    },
    questionsCorrect: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

UserProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });
UserProgressSchema.index({ userId: 1 });

const UserProgress =
  mongoose.models.UserProgress ||
  mongoose.model<IUserProgressDocument>("UserProgress", UserProgressSchema);

export default UserProgress;
