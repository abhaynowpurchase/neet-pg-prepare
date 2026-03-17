import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stethoscope, BookOpen, Brain, Trophy, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">NEET PG Stories</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <BookOpen size={14} />
          Story-based medical learning
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Learn NEET PG through{" "}
          <span className="text-primary">compelling stories</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Stop memorizing. Start understanding. Master Community Medicine and
          more through immersive medical stories that make concepts unforgettable.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button size="lg" asChild className="gap-2">
            <Link href="/register">
              Start learning free <ArrowRight size={16} />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: BookOpen,
            title: "Story-Based Learning",
            desc: "Learn through vivid medical scenarios. A rural PHC outbreak teaches epidemiology better than any textbook.",
          },
          {
            icon: Brain,
            title: "High-Yield Notes",
            desc: "Every story ends with exam-focused high-yield points distilled from 30 years of NEET PG papers.",
          },
          {
            icon: Trophy,
            title: "Previous Year Questions",
            desc: "Practice with real NEET PG, INI-CET, and UPSC CMO questions with detailed explanations.",
          },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          );
        })}
      </section>

      {/* Subjects */}
      <section className="max-w-5xl mx-auto px-6 py-8 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">
          Subjects available
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Community Medicine",
            "Pathology",
            "Pharmacology",
            "Microbiology",
            "Forensic Medicine",
            "Medicine",
            "Surgery",
            "OBG",
          ].map((s) => (
            <span
              key={s}
              className="px-4 py-2 rounded-full bg-white border text-sm font-medium shadow-sm"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Starting with Community Medicine · More subjects launching soon
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NEET PG Story Learning. Built for medical aspirants.
      </footer>
    </main>
  );
}
