import mongoose, { Document, Schema } from "mongoose";

export interface IChapterDocument extends Document {
  subjectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  storyContent: string;
  highYieldNotes: string;
  order: number;
  estimatedReadTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IChapterDocument>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Chapter title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    storyContent: {
      type: String,
      required: [true, "Story content is required"],
    },
    highYieldNotes: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    estimatedReadTime: {
      type: Number,
      default: 15, // minutes
    },
  },
  {
    timestamps: true,
  }
);

ChapterSchema.index({ subjectId: 1, order: 1 });

const Chapter =
  mongoose.models.Chapter ||
  mongoose.model<IChapterDocument>("Chapter", ChapterSchema);

export default Chapter;
