import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CrawlerDashboard from "./CrawlerDashboard";

export const metadata = { title: "Crawler Dashboard | NEET PG" };

export default async function CrawlerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <CrawlerDashboard />;
}
