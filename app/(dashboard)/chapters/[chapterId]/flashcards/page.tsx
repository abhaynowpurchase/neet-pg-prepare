import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FlashcardsClient from "./FlashcardsClient";

export default async function FlashcardsPage({
  params,
}: {
  params: { chapterId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <FlashcardsClient chapterId={params.chapterId} />;
}
