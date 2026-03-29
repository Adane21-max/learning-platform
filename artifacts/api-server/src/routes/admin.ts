import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, paymentSlipsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    res.status(500).json({ error: "Admin password not configured" });
    return;
  }

  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  res.json({ success: true });
});

router.get("/admin/students", async (req, res) => {
  try {
    const students = await db.select().from(studentsTable).orderBy(studentsTable.createdAt);
    const slips = await db.select({ studentId: paymentSlipsTable.studentId }).from(paymentSlipsTable);
    const slipSet = new Set(slips.map((s) => s.studentId));

    const result = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      rejectionReason: s.rejectionReason ?? null,
      createdAt: s.createdAt,
      approvedAt: s.approvedAt ?? null,
      hasPaymentSlip: slipSet.has(s.id),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list students");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/students/:studentId/approve", async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (isNaN(studentId)) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }

  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    await db
      .update(studentsTable)
      .set({ status: "approved", approvedAt: new Date(), rejectionReason: null })
      .where(eq(studentsTable.id, studentId));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to approve student");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/students/:studentId/reject", async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (isNaN(studentId)) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }

  const { reason } = req.body;

  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    await db
      .update(studentsTable)
      .set({ status: "rejected", rejectionReason: reason || "No reason provided" })
      .where(eq(studentsTable.id, studentId));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reject student");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/students/:studentId/suspend", async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (isNaN(studentId)) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }

  try {
    await db
      .update(studentsTable)
      .set({ status: "suspended" })
      .where(eq(studentsTable.id, studentId));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to suspend student");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/students/:studentId/payment-slip", async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (isNaN(studentId)) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }

  try {
    const [slip] = await db
      .select()
      .from(paymentSlipsTable)
      .where(eq(paymentSlipsTable.studentId, studentId));

    if (!slip) {
      res.status(404).json({ error: "Payment slip not found" });
      return;
    }

    res.json({
      fileData: slip.fileData,
      fileName: slip.fileName,
      mimeType: slip.mimeType,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get payment slip");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
