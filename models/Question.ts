import mongoose, { Document, Schema } from "mongoose";

export type ExamType = "NEET_PG" | "INI_CET" | "UPSC_CMO";

export interface IQuestionDocument extends Document {
  chapterId: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examType: ExamType;
  year: number;
  difficulty: "easy" | "medium" | "hard";
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestionDocument>(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter ID is required"],
      index: true,
    },
    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: "Exactly 4 options are required",
      },
    },
    correctAnswer: {
      type: Number,
      required: [true, "Correct answer index is required"],
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: [true, "Explanation is required"],
      trim: true,
    },
    examType: {
      type: String,
      enum: ["NEET_PG", "INI_CET", "UPSC_CMO"],
      required: [true, "Exam type is required"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: 1990,
      max: new Date().getFullYear(),
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

// Chapter-scoped queries (chapter page quiz, fetch-pyq dedup/count)
QuestionSchema.index({ chapterId: 1, examType: 1, year: -1 });
QuestionSchema.index({ chapterId: 1, examType: 1, difficulty: 1 });

// PYQ page: filter by exam type + sort by year
QuestionSchema.index({ examType: 1, year: -1 });

// PYQ page: filter by exam type + difficulty + sort by year
QuestionSchema.index({ examType: 1, difficulty: 1, year: -1 });

// PYQ page: default sort (no filters) — matches .sort({ year: -1, examType: 1 })
QuestionSchema.index({ year: -1, examType: 1 });

const Question =
  mongoose.models.Question ||
  mongoose.model<IQuestionDocument>("Question", QuestionSchema);

export default Question;
