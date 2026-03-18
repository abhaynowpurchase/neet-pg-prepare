import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExpectedQuestions from "@/components/dashboard/ExpectedQuestions";

export const metadata = {
  title: "Expected Questions This Year | NEET PG",
};

export default async function ExpectedQuestionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <ExpectedQuestions />
    </div>
  );
}
