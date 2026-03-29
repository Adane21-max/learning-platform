import { useState, useMemo } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { useGetQuiz } from "@workspace/api-client-react";
import { Loader2, ArrowLeft } from "lucide-react";
import { QuestionDisplay } from "@/components/quiz/QuestionDisplay";
import { Button } from "@/components/ui/Button";

export default function Session() {
  const [, params] = useRoute("/session/:sessionId");
  const searchStr = useSearch();
  const [, setLocation] = useLocation();
  
  const sessionId = params?.sessionId ? parseInt(params.sessionId, 10) : 0;
  
  // Parse quizId from query params
  const quizId = useMemo(() => {
    const searchParams = new URLSearchParams(searchStr);
    return parseInt(searchParams.get("quizId") || "0", 10);
  }, [searchStr]);

  const { data: quiz, isLoading, isError } = useGetQuiz(quizId, {
    query: { enabled: !!quizId }
  });

  const [currentIndex, setCurrentQuestionIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pattern-grid">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-xl font-display font-medium text-muted-foreground animate-pulse">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (isError || !quiz || !sessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Oops! Something went wrong.</h2>
          <p className="text-muted-foreground mb-8">We couldn't load this quiz session. Please return to the home page and try again.</p>
          <Button onClick={() => setLocation("/")}>Back to Quizzes</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex) / quiz.questions.length) * 100;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      setLocation(`/session/${sessionId}/result`);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExit = () => {
    if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-background/50 flex flex-col">
      {/* Quiz Header & Progress */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleExit} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Quiz
          </Button>
          
          <div className="flex flex-col items-center flex-1 max-w-md mx-4">
            <div className="flex justify-between w-full text-xs font-bold text-muted-foreground mb-1.5 px-1">
              <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="w-[100px]" /> {/* Spacer to balance the layout */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-16 flex flex-col justify-center">
        {currentQuestion && (
          <QuestionDisplay
            key={currentQuestion.id} // Forces re-mount on new question
            sessionId={sessionId}
            question={currentQuestion}
            onNext={handleNext}
            isLastQuestion={isLastQuestion}
          />
        )}
      </main>
    </div>
  );
}
