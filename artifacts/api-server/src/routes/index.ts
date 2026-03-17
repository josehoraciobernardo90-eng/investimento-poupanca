import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import usersRouter from "./users.js";
import loansRouter from "./loans.js";
import requestsRouter from "./requests.js";
import dashboardRouter from "./dashboard.js";
import auditRouter from "./audit.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/loans", loansRouter);
router.use("/requests", requestsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/audit", auditRouter);

export default router;
