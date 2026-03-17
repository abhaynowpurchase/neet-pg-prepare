import mongoose, { Document, Schema } from "mongoose";

export interface IHighYieldTopicDocument extends Document {
  chapterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  keyPoints: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HighYieldTopicSchema = new Schema<IHighYieldTopicDocument>(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

HighYieldTopicSchema.index({ chapterId: 1, order: 1 });

const HighYieldTopic =
  mongoose.models.HighYieldTopic ||
  mongoose.model<IHighYieldTopicDocument>(
    "HighYieldTopic",
    HighYieldTopicSchema
  );

export default HighYieldTopic;
