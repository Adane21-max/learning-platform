import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { studentsTable, paymentSlipsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    studentId?: number;
  }
}

const router: IRouter = Router();

router.post("/auth/register", async (req, res) => {
  const { name, email, password, paymentSlipData, paymentSlipName, paymentSlipMime } = req.body;

  if (!name || !email || !password || !paymentSlipData || !paymentSlipName || !paymentSlipMime) {
    res.status(400).json({ error: "All fields including payment slip are required" });
    return;
  }

  try {
    const [existing] = await db.select().from(studentsTable).where(eq(studentsTable.email, email.toLowerCase()));
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [student] = await db
      .insert(studentsTable)
      .values({ name, email: email.toLowerCase(), passwordHash, status: "pending" })
      .returning();

    await db.insert(paymentSlipsTable).values({
      studentId: student.id,
      fileData: paymentSlipData,
      fileName: paymentSlipName,
      mimeType: paymentSlipMime,
    });

    res.status(201).json({
      message: "Registration submitted successfully. Please wait for admin approval.",
      studentId: student.id,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to register student");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.email, email.toLowerCase()));

    if (!student) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, student.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (student.status === "pending") {
      res.status(403).json({ error: "Your registration is pending admin approval. Please check back later." });
      return;
    }

    if (student.status === "rejected") {
      res.status(403).json({ error: `Your registration was rejected. Reason: ${student.rejectionReason || "No reason provided"}` });
      return;
    }

    if (student.status === "suspended") {
      res.status(403).json({ error: "Your account has been suspended. Please contact the administrator." });
      return;
    }

    req.session.studentId = student.id;

    res.json({
      id: student.id,
      name: student.name,
      email: student.email,
      status: student.status,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to login student");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res) => {
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
      req.session.destroy(() => {});
      res.status(401).json({ error: "Session invalid" });
      return;
    }

    res.json({
      id: student.id,
      name: student.name,
      email: student.email,
      status: student.status,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get current student");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
