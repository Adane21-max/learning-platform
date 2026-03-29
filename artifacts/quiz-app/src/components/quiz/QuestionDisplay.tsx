import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSubmitAnswer } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import type { Question, AnswerResult } from "@workspace/api-client-react/src/generated/api.schemas";

interface QuestionDisplayProps {
  sessionId: number;
  question: Question;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function QuestionDisplay({ sessionId, question, onNext, isLastQuestion }: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [shortAnswerText, setShortAnswerText] = useState("");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  
  const { mutate: submitAnswer, isPending } = useSubmitAnswer();

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer("");
    setShortAnswerText("");
    setFeedback(null);
  }, [question.id]);

  const handleSubmit = (answer: string) => {
    if (!answer.trim()) return;
    
    setSelectedAnswer(answer);
    submitAnswer(
      { sessionId, data: { questionId: question.id, answer } },
      {
        onSuccess: (res) => {
          setFeedback(res);
        }
      }
    );
  };

  const renderOptions = () => {
    if (question.questionType === "short_answer") {
      return (
        <div className="space-y-4 w-full max-w-xl mx-auto">
          <input
            type="text"
            value={shortAnswerText}
            onChange={(e) => setShortAnswerText(e.target.value)}
            disabled={!!feedback || isPending}
            placeholder="Type your answer here..."
            className="w-full px-6 py-4 rounded-2xl border-2 border-input bg-background text-lg shadow-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !feedback && shortAnswerText) {
                handleSubmit(shortAnswerText);
              }
            }}
          />
          {!feedback && (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => handleSubmit(shortAnswerText)}
              disabled={!shortAnswerText.trim() || isPending}
            >
              Submit Answer
            </Button>
          )}
        </div>
      );
    }

    const options = question.questionType === "true_false" 
      ? ["True", "False"] 
      : question.options || [];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt;
          const isSubmitted = !!feedback;
          const isCorrectAnswer = feedback?.correctAnswer === opt;
          const isWrongSelection = isSubmitted && isSelected && !feedback.correct;
          
          return (
            <button
              key={opt}
              onClick={() => !isSubmitted && handleSubmit(opt)}
              disabled={isSubmitted || isPending}
              className={cn(
                "relative flex items-center p-6 rounded-2xl border-2 text-left transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
                !isSubmitted && "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:-translate-y-1 bg-card",
                isSubmitted && isCorrectAnswer && "border-success bg-success/10 text-success-foreground",
                isSubmitted && isWrongSelection && "border-destructive bg-destructive/10 text-destructive-foreground",
                isSubmitted && !isCorrectAnswer && !isWrongSelection && "border-input bg-muted/50 opacity-50",
                isSelected && !isSubmitted && "border-primary bg-primary/5 shadow-md shadow-primary/10"
              )}
            >
              <span className="font-semibold text-lg">{opt}</span>
              
              {isSubmitted && isCorrectAnswer && (
                <CheckCircle2 className="w-6 h-6 text-success ml-auto absolute right-6" />
              )}
              {isSubmitted && isWrongSelection && (
                <XCircle className="w-6 h-6 text-destructive ml-auto absolute right-6" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full">
      <div className="w-full bg-card rounded-3xl shadow-xl shadow-black/5 border border-border p-8 md:p-12 mb-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center leading-tight mb-12 text-foreground">
          {question.questionText}
        </h2>
        
        {renderOptions()}
      </div>

      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "w-full rounded-2xl p-6 md:p-8 border shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6",
              feedback.correct 
                ? "bg-success/10 border-success/30 shadow-success/5" 
                : "bg-destructive/10 border-destructive/30 shadow-destructive/5"
            )}
          >
            <div className="flex gap-4 items-start">
              <div className={cn(
                "p-3 rounded-full mt-1",
                feedback.correct ? "bg-success text-white" : "bg-destructive text-white"
              )}>
                {feedback.correct ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <div>
                <h3 className={cn(
                  "text-2xl font-bold font-display mb-1",
                  feedback.correct ? "text-success-foreground" : "text-destructive-foreground"
                )}>
                  {feedback.correct ? "Excellent!" : "Not quite right."}
                </h3>
                
                {!feedback.correct && (
                  <p className="text-foreground/80 font-medium mb-2 text-lg">
                    The correct answer is: <span className="font-bold border-b-2 border-primary/30 pb-0.5">{feedback.correctAnswer}</span>
                  </p>
                )}
                
                {feedback.explanation && (
                  <div className="flex items-start gap-2 mt-3 text-muted-foreground bg-background/50 p-4 rounded-xl border border-border/50">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                    <p className="text-sm leading-relaxed">{feedback.explanation}</p>
                  </div>
                )}
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={onNext}
              className="shrink-0 w-full sm:w-auto text-lg px-8 h-14"
              variant={feedback.correct ? "success" : "default"}
            >
              {isLastQuestion ? "View Results" : "Next Question"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
