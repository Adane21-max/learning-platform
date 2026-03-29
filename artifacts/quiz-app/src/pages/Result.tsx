import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetSessionResult } from "@workspace/api-client-react";
import { Loader2, Home, RotateCcw, CheckCircle2, XCircle, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export default function Result() {
  const [, params] = useRoute("/session/:sessionId/result");
  const [, setLocation] = useLocation();
  const sessionId = params?.sessionId ? parseInt(params.sessionId, 10) : 0;

  const { data: result, isLoading, isError } = useGetSessionResult(sessionId, {
    query: { enabled: !!sessionId }
  });

  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    if (result && !hasCelebrated) {
      if (result.score >= 70) {
        // Confetti celebration for passing scores
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#06b6d4', '#10b981']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6366f1', '#06b6d4', '#10b981']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }
      setHasCelebrated(true);
    }
  }, [result, hasCelebrated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pattern-grid">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-xl font-display font-medium text-muted-foreground animate-pulse">Calculating your results...</p>
        </div>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Could not load results</h2>
          <p className="text-muted-foreground mb-8">We couldn't retrieve your session results.</p>
          <Button onClick={() => setLocation("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const isPassing = result.score >= 70;

  return (
    <div className="min-h-screen bg-background pattern-grid py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Score Hero Section */}
        <div className="bg-card rounded-3xl shadow-xl shadow-primary/5 border border-border p-8 md:p-12 mb-8 relative overflow-hidden text-center">
          <div className={cn(
            "absolute top-0 left-0 w-full h-2",
            isPassing ? "bg-success" : "bg-accent"
          )} />
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-inner bg-muted">
            {isPassing ? (
              <Trophy className="w-10 h-10 text-success" />
            ) : (
              <Target className="w-10 h-10 text-accent" />
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            Quiz Completed!
          </h1>
          <p className="text-xl text-muted-foreground mb-10 font-medium">
            You just finished "{result.quizTitle}"
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="relative flex items-center justify-center">
              {/* Circular Progress SVG */}
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96" cy="96" r="88"
                  className="stroke-muted" strokeWidth="16" fill="none"
                />
                <circle
                  cx="96" cy="96" r="88"
                  className={cn("transition-all duration-1500 ease-out", isPassing ? "stroke-success" : "stroke-accent")}
                  strokeWidth="16" fill="none"
                  strokeDasharray="553"
                  strokeDashoffset={553 - (553 * result.score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-display font-black tracking-tighter">
                  {Math.round(result.score)}<span className="text-2xl text-muted-foreground">%</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div className="bg-background rounded-2xl p-4 border border-border shadow-sm min-w-[200px]">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Correct Answers</p>
                <p className="text-3xl font-bold font-display text-foreground">
                  <span className="text-success">{result.correctAnswers}</span> <span className="text-muted-foreground text-xl font-medium">/ {result.totalQuestions}</span>
                </p>
              </div>
              <div className="bg-background rounded-2xl p-4 border border-border shadow-sm min-w-[200px]">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                <p className={cn("text-2xl font-bold font-display", isPassing ? "text-success" : "text-accent")}>
                  {isPassing ? "Passed" : "Needs Review"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-8" onClick={() => setLocation("/")}>
            <Home className="w-5 h-5 mr-2" />
            Back to Quizzes
          </Button>
          <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => {
            // Need to pass quizId to restart, getting it from result
            // Actually, we don't have startSession mutation here easily without importing it, 
            // so redirecting to home or creating a restart flow is best. Let's redirect to home for simplicity or just start session.
            setLocation("/");
          }}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Another Quiz
          </Button>
        </div>

        {/* Answer Review Section */}
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground mb-6">Detailed Review</h2>
          <div className="space-y-4">
            {result.answers.map((ans, idx) => (
              <div 
                key={ans.questionId}
                className={cn(
                  "p-6 rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md",
                  ans.correct ? "border-success/20 border-l-4 border-l-success" : "border-destructive/20 border-l-4 border-l-destructive"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {ans.correct ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <XCircle className="w-6 h-6 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-muted-foreground mb-1">Question {idx + 1}</p>
                    <p className="text-lg font-bold text-foreground mb-4">{ans.questionText}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-background rounded-xl p-3 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Your Answer</p>
                        <p className={cn(
                          "font-medium",
                          ans.correct ? "text-success" : "text-destructive line-through decoration-2 opacity-80"
                        )}>
                          {ans.studentAnswer}
                        </p>
                      </div>
                      
                      {!ans.correct && (
                        <div className="bg-success/10 rounded-xl p-3 border border-success/20">
                          <p className="text-xs font-semibold text-success/80 mb-1 uppercase tracking-wider">Correct Answer</p>
                          <p className="font-medium text-success-foreground">{ans.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
