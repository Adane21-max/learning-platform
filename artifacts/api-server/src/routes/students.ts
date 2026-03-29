import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, sessionsTable, sessionAnswersTable, quizzesTable, questionsTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/students/profile", async (req, res) => {
  if (!req.session.studentId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, req.session.studentId));

    if (!student) {
      res.status(401).json({ error: "Student not found" });
      return;
    }

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.studentId, student.id));

    const sessionSummaries = await Promise.all(
      sessions.map(async (s) => {
        const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, s.quizId));
        const answers = await db.select().from(sessionAnswersTable).where(eq(sessionAnswersTable.sessionId, s.id));
        const [qCount] = await db.select({ count: count() }).from(questionsTable).where(eq(questionsTable.quizId, s.quizId));
        const total = Number(qCount?.count ?? 0);
        const correct = answers.filter((a) => a.correct).length;
        const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        return {
          id: s.id,
          quizName: quiz?.title ?? "Unknown Quiz",
          quizSubject: quiz?.subject ?? "",
          scorePercentage,
          correctAnswers: correct,
          totalQuestions: total,
          completedAt: s.completedAt ?? null,
        };
      })
    );

    const averageScore =
      sessionSummaries.length > 0
        ? Math.round(sessionSummaries.reduce((sum, s) => sum + s.scorePercentage, 0) / sessionSummaries.length)
        : 0;

    res.json({
      student: { id: student.id, name: student.name, email: student.email, status: student.status },
      sessions: sessionSummaries,
      totalQuizzesTaken: sessionSummaries.length,
      averageScore,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get student profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
