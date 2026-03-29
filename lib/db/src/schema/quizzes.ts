import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id),
  orderIndex: integer("order_index").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"),
  options: text("options"),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
});

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id),
  studentId: integer("student_id"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const sessionAnswersTable = pgTable("session_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  questionId: integer("question_id").notNull().references(() => questionsTable.id),
  studentAnswer: text("student_answer").notNull(),
  correct: boolean("correct").notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzesTable).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, startedAt: true, completedAt: true });
export const insertSessionAnswerSchema = createInsertSchema(sessionAnswersTable).omit({ id: true });

export type Quiz = typeof quizzesTable.$inferSelect;
export type Question = typeof questionsTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
export type SessionAnswer = typeof sessionAnswersTable.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertSessionAnswer = z.infer<typeof insertSessionAnswerSchema>;
