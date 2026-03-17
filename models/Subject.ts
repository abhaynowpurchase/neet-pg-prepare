import mongoose, { Document, Schema } from "mongoose";

export interface ISubjectDocument extends Document {
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubjectDocument>(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    icon: {
      type: String,
      default: "BookOpen",
    },
    color: {
      type: String,
      default: "green",
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

// All subject listings sort by order
SubjectSchema.index({ order: 1 });

const Subject =
  mongoose.models.Subject ||
  mongoose.model<ISubjectDocument>("Subject", SubjectSchema);

export default Subject;
