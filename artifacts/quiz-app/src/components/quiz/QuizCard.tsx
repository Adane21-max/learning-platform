import { ArrowRight, Book, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStartSession } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import type { Quiz } from "@workspace/api-client-react/src/generated/api.schemas";

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const [, setLocation] = useLocation();
  const { mutate: startSession, isPending } = useStartSession();

  const handleStart = () => {
    startSession(
      { data: { quizId: quiz.id } },
      {
        onSuccess: (session) => {
          setLocation(`/session/${session.id}?quizId=${quiz.id}`);
        }
      }
    );
  };

  return (
    <Card className="group hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
      
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary/15 text-secondary-foreground">
            <Book className="w-3.5 h-3.5" />
            {quiz.subject}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
            <HelpCircle className="w-3.5 h-3.5" />
            {quiz.questionCount} Qs
          </span>
        </div>
        <CardTitle className="text-2xl mt-2 line-clamp-2">{quiz.title}</CardTitle>
        <CardDescription className="line-clamp-2 mt-2 text-base">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      
      <CardFooter>
        <Button 
          onClick={handleStart} 
          disabled={isPending}
          className="w-full group/btn"
        >
          {isPending ? "Preparing..." : "Start Quiz"}
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
