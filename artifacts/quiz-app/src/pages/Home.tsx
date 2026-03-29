import { Link } from "wouter";
import { useListQuizzes } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { QuizCard } from "@/components/quiz/QuizCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  BookOpen,
  Trophy,
  Zap,
} from "lucide-react";

export default function Home() {
  const { student, isLoading: authLoading } = useAuth();
  const { data: quizzes, isLoading, error } = useListQuizzes();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pattern-grid">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col pattern-grid">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {/* Hero */}
          <section className="relative flex-1 flex flex-col items-center justify-center py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-secondary/5 -z-10" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-10 text-sm font-semibold text-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Sparkles className="w-4 h-4" />
                Welcome to Ada21Tech Learning Platform
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-foreground leading-[1.08] animate-in fade-in slide-in-from-bottom-6 duration-700">
                Master new subjects{" "}
                <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  with interactive quizzes
                </span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Test your knowledge, get instant feedback, and track your
                progress across multiple subjects. Learning has never been this
                engaging.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-2xl bg-background border-2 border-border text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  Sign In
                </Link>
              </div>

              {/* Feature cards */}
              <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                {[
                  {
                    icon: <BookOpen className="w-6 h-6" />,
                    title: "Multiple Subjects",
                    desc: "Math, Science, History and more — all in one place.",
                  },
                  {
                    icon: <Zap className="w-6 h-6" />,
                    title: "Instant Feedback",
                    desc: "Know immediately if your answer is right with clear explanations.",
                  },
                  {
                    icon: <Trophy className="w-6 h-6" />,
                    title: "Track Progress",
                    desc: "See your scores over time and watch yourself improve.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                      {f.icon}
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-2">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pattern-grid">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Welcome banner */}
        <section className="relative pt-16 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-6 text-sm font-semibold text-primary">
              <Sparkles className="w-4 h-4" />
              Welcome to the future of learning
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-foreground mb-3">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {student.name.split(" ")[0]}!
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Ready to challenge yourself? Pick a quiz below to get started.
            </p>
          </div>
        </section>

        {/* Quizzes Grid */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-display text-foreground">
              Available Quizzes
            </h2>
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Trophy className="w-4 h-4" />
              View My Progress
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-muted/50 animate-pulse border border-border flex items-center justify-center"
                >
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-destructive/5 rounded-3xl border border-destructive/10">
              <p className="text-destructive font-semibold text-lg">
                Failed to load quizzes. Please try again later.
              </p>
            </div>
          ) : !quizzes?.length ? (
            <div className="text-center py-24 bg-card rounded-3xl border border-border shadow-sm">
              <BookOpen className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-xl font-semibold text-foreground mb-2">
                No quizzes yet
              </p>
              <p className="text-muted-foreground">
                Check back later for new content.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
