import mongoose, { Document, Schema } from "mongoose";

export interface IFlashcardDocument extends Document {
  chapterId: mongoose.Types.ObjectId;
  front: string;
  back: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcardDocument>(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true,
    },
    front: { type: String, required: true, trim: true },
    back: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FlashcardSchema.index({ chapterId: 1, order: 1 });

const Flashcard =
  mongoose.models.Flashcard ||
  mongoose.model<IFlashcardDocument>("Flashcard", FlashcardSchema);

export default Flashcard;
