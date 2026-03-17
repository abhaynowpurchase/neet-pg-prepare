import type { Metadata } from "next";
import SubjectClient from "./SubjectClient";

export const metadata: Metadata = { title: "Subject" };

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  return <SubjectClient subjectId={params.subjectId} />;
}
