import type { Metadata } from "next";
import SubjectsClient from "./SubjectsClient";

export const metadata: Metadata = { title: "Subjects" };

export default function SubjectsPage() {
  return <SubjectsClient />;
}
