import mongoose, { Document, Schema } from "mongoose";

export interface IAnatomyPart {
  id: string;
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  geometry: "box" | "sphere" | "cylinder" | "torus" | "cone" | "capsule";
  size: number[];
  color: string;
  emissiveColor?: string;
  info: string;
  pulse?: boolean;
}

export interface IAnatomySceneDocument extends Document {
  chapterKey: string;
  title: string;
  description: string;
  bgColor: string;
  cameraPosition: [number, number, number];
  autoRotate?: boolean;
  highlights?: string[];
  parts: IAnatomyPart[];
  createdAt: Date;
  updatedAt: Date;
}

const AnatomyPartSchema = new Schema<IAnatomyPart>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    position: { type: [Number], required: true },
    rotation: { type: [Number] },
    geometry: {
      type: String,
      enum: ["box", "sphere", "cylinder", "torus", "cone", "capsule"],
      required: true,
    },
    size: { type: [Number], required: true },
    color: { type: String, required: true },
    emissiveColor: { type: String },
    info: { type: String, required: true },
    pulse: { type: Boolean, default: false },
  },
  { _id: false }
);

const AnatomySceneSchema = new Schema<IAnatomySceneDocument>(
  {
    chapterKey: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bgColor: { type: String, required: true },
    cameraPosition: { type: [Number], required: true },
    autoRotate: { type: Boolean, default: false },
    highlights: { type: [String], default: [] },
    parts: { type: [AnatomyPartSchema], required: true },
  },
  { timestamps: true }
);

const AnatomyScene =
  mongoose.models.AnatomyScene ||
  mongoose.model<IAnatomySceneDocument>("AnatomyScene", AnatomySceneSchema);

export default AnatomyScene;
