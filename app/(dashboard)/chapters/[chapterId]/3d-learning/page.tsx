import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ThreeDClient from "./ThreeDClient";

export default async function ThreeDLearningPage({
  params,
}: {
  params: { chapterId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <ThreeDClient chapterId={params.chapterId} />;
}
