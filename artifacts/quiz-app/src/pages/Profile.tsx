import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { useGetStudentProfile } from "@workspace/api-client-react";
import { Loader2, AlertCircle, ArrowLeft, Award, BookOpen, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Link, useLocation } from "wouter";

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success">{score}%</span>;
  }
  if (score >= 50) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent-foreground">{score}%</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive">{score}%</span>;
}

export default function Profile() {
  const { student, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading, error } = useGetStudentProfile({ query: { enabled: !!student } });

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background pattern-grid">
        <Navbar />
        <div className="flex-1 flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!student) {
    setLocation("/login");
    return null;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background pattern-grid">
        <Navbar />
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Error Loading Profile</h3>
            <p className="mb-4">We couldn't load your quiz history. Please try again later.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pattern-grid">
      <Navbar />
      
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold font-display text-foreground tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground mt-2">View your learning progress and quiz history.</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")} className="gap-2 hidden sm:flex">
            <ArrowLeft className="w-4 h-4" />
            Back to Quizzes
          </Button>
        </div>

        {/* Profile Overview Card */}
        <div className="bg-card rounded-3xl border border-border shadow-md p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-display font-bold">
                {profile.student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-foreground">{profile.student.name}</h2>
                <p className="text-muted-foreground">{profile.student.email}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success">
                  Active Student
                </div>
              </div>
            </div>

            <div className="flex gap-6 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none text-center bg-muted/50 rounded-2xl p-4 min-w-[120px]">
                <div className="flex justify-center text-primary mb-2"><BookOpen className="w-6 h-6" /></div>
                <p className="text-3xl font-bold font-display text-foreground">{profile.totalQuizzesTaken}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Quizzes</p>
              </div>
              <div className="flex-1 sm:flex-none text-center bg-muted/50 rounded-2xl p-4 min-w-[120px]">
                <div className="flex justify-center text-secondary mb-2"><Award className="w-6 h-6" /></div>
                <p className="text-3xl font-bold font-display text-foreground">{Math.round(profile.averageScore)}%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Avg Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz History */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Recent Sessions
          </h3>
        </div>

        {!profile.sessions?.length ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Target className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-foreground mb-2">No quizzes taken yet</h4>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't completed any quizzes yet. Start taking quizzes to see your progress here.
            </p>
            <Button onClick={() => setLocation("/")}>Browse Quizzes</Button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Quiz Name</th>
                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Subject</th>
                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Score</th>
                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Correct</th>
                    <th className="px-6 py-4 text-sm font-semibold text-foreground text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profile.sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{session.quizName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {session.quizSubject}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ScoreBadge score={session.scorePercentage} />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {session.correctAnswers} / {session.totalQuestions}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground text-right">
                        {new Date(session.completedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
