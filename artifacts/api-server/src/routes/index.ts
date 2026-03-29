import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quizzesRouter from "./quizzes";
import sessionsRouter from "./sessions";
import adminRouter from "./admin";
import authRouter from "./auth";
import studentsRouter from "./students";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studentsRouter);
router.use(quizzesRouter);
router.use(sessionsRouter);
router.use(adminRouter);

export default router;
