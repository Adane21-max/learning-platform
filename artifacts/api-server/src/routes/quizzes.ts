import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { quizzesTable, questionsTable, sessionAnswersTable, sessionsTable } from "@workspace/db/schema";
import { eq, count, and, max } from "drizzle-orm";

const router: IRouter = Router();

router.get("/quizzes", async (req, res) => {
  try {
    const quizzes = await db.select().from(quizzesTable);
    const result = await Promise.all(
      quizzes.map(async (quiz) => {
        const [countRow] = await db
          .select({ count: count() })
          .from(questionsTable)
          .where(eq(questionsTable.quizId, quiz.id));
        return {
          id: quiz.id,
          title: quiz.title,
          subject: quiz.subject,
          description: quiz.description,
          questionCount: Number(countRow?.count ?? 0),
        };
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list quizzes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quizzes/:quizId", async (req, res) => {
  const quizId = parseInt(req.params.quizId, 10);
  if (isNaN(quizId)) {
    res.status(400).json({ error: "Invalid quiz ID" });
    return;
  }

  try {
    const [quiz] = await db
      .select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId));

    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.quizId, quizId))
      .orderBy(questionsTable.orderIndex);

    const sanitizedQuestions = questions.map((q) => ({
      id: q.id,
      quizId: q.quizId,
      orderIndex: q.orderIndex,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options ? JSON.parse(q.options) : null,
    }));

    res.json({
      id: quiz.id,
      title: quiz.title,
      subject: quiz.subject,
      description: quiz.description,
      questions: sanitizedQuestions,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get quiz");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quizzes", async (req, res) => {
  const { title, subject, description } = req.body;
  if (!title || !subject) {
    res.status(400).json({ error: "title and subject are required" });
    return;
  }

  try {
    const [quiz] = await db
      .insert(quizzesTable)
      .values({ title, subject, description: description ?? "" })
      .returning();

    res.status(201).json({
      id: quiz.id,
      title: quiz.title,
      subject: quiz.subject,
      description: quiz.description,
      questionCount: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create quiz");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quizzes/:quizId", async (req, res) => {
  const quizId = parseInt(req.params.quizId, 10);
  if (isNaN(quizId)) {
    res.status(400).json({ error: "Invalid quiz ID" });
    return;
  }

  try {
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.quizId, quizId));
    for (const session of sessions) {
      await db.delete(sessionAnswersTable).where(eq(sessionAnswersTable.sessionId, session.id));
    }
    await db.delete(sessionsTable).where(eq(sessionsTable.quizId, quizId));
    await db.delete(questionsTable).where(eq(questionsTable.quizId, quizId));
    await db.delete(quizzesTable).where(eq(quizzesTable.id, quizId));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete quiz");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quizzes/:quizId/questions", async (req, res) => {
  const quizId = parseInt(req.params.quizId, 10);
  if (isNaN(quizId)) {
    res.status(400).json({ error: "Invalid quiz ID" });
    return;
  }

  const { questionText, questionType, options, correctAnswer, explanation } = req.body;
  if (!questionText || !questionType || !correctAnswer) {
    res.status(400).json({ error: "questionText, questionType, and correctAnswer are required" });
    return;
  }

  try {
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    const [maxRow] = await db
      .select({ maxOrder: max(questionsTable.orderIndex) })
      .from(questionsTable)
      .where(eq(questionsTable.quizId, quizId));

    const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

    const [question] = await db
      .insert(questionsTable)
      .values({
        quizId,
        orderIndex: nextOrder,
        questionText,
        questionType,
        options: options && options.length > 0 ? JSON.stringify(options) : null,
        correctAnswer,
        explanation: explanation ?? null,
      })
      .returning();

    res.status(201).json({
      id: question.id,
      quizId: question.quizId,
      orderIndex: question.orderIndex,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options ? JSON.parse(question.options) : null,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add question");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quizzes/:quizId/questions/:questionId", async (req, res) => {
  const quizId = parseInt(req.params.quizId, 10);
  const questionId = parseInt(req.params.questionId, 10);
  if (isNaN(quizId) || isNaN(questionId)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const [question] = await db
      .select()
      .from(questionsTable)
      .where(and(eq(questionsTable.id, questionId), eq(questionsTable.quizId, quizId)));

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    await db.delete(sessionAnswersTable).where(eq(sessionAnswersTable.questionId, questionId));
    await db.delete(questionsTable).where(eq(questionsTable.id, questionId));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete question");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
