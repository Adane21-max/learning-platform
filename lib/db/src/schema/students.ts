import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
});

export const paymentSlipsTable = pgTable("payment_slips", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  fileData: text("file_data").notNull(), // base64 encoded
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});
export const insertPaymentSlipSchema = createInsertSchema(paymentSlipsTable).omit({
  id: true,
  uploadedAt: true,
});

export type Student = typeof studentsTable.$inferSelect;
export type PaymentSlip = typeof paymentSlipsTable.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertPaymentSlip = z.infer<typeof insertPaymentSlipSchema>;
