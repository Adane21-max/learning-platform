import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { questionsTable, sessionsTable, sessionAnswersTable, quizzesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.post("/sessions", async (req, res) => {
  const { quizId } = req.body;
  if (!quizId || typeof quizId !== "number") {
    res.status(400).json({ error: "quizId is required" });
    return;
  }

  try {
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const [session] = await db
      .insert(sessionsTable)
      .values({ quizId, studentId: req.session.studentId ?? null })
      .returning();

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.quizId, quizId));

    res.status(201).json({
      id: session.id,
      quizId: session.quizId,
      startedAt: session.startedAt,
      totalQuestions: questions.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to start session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sessions/:sessionId/answer", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const { questionId, answer } = req.body;
  if (!questionId || typeof questionId !== "number" || !answer || typeof answer !== "string") {
    res.status(400).json({ error: "questionId and answer are required" });
    return;
  }

  try {
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [question] = await db
      .select()
      .from(questionsTable)
      .where(and(eq(questionsTable.id, questionId), eq(questionsTable.quizId, session.quizId)));

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const correct =
      answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    await db.insert(sessionAnswersTable).values({
      sessionId,
      questionId,
      studentAnswer: answer,
      correct,
    });

    const allQuestions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.quizId, session.quizId))
      .orderBy(questionsTable.orderIndex);

    const questionIndex = allQuestions.findIndex((q) => q.id === questionId);

    res.json({
      correct,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? null,
      questionIndex: questionIndex + 1,
      totalQuestions: allQuestions.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit answer");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sessions/:sessionId/result", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  try {
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, session.quizId));
    const answers = await db
      .select()
      .from(sessionAnswersTable)
      .where(eq(sessionAnswersTable.sessionId, sessionId));

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.quizId, session.quizId))
      .orderBy(questionsTable.orderIndex);

    const correctCount = answers.filter((a) => a.correct).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const answerSummaries = questions.map((q) => {
      const given = answers.find((a) => a.questionId === q.id);
      return {
        questionId: q.id,
        questionText: q.questionText,
        studentAnswer: given?.studentAnswer ?? "(no answer)",
        correctAnswer: q.correctAnswer,
        correct: given?.correct ?? false,
      };
    });

    res.json({
      sessionId: session.id,
      quizId: session.quizId,
      quizTitle: quiz?.title ?? "Quiz",
      totalQuestions: total,
      correctAnswers: correctCount,
      score,
      answers: answerSummaries,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get session result");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
