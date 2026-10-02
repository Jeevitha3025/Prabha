import { Router, type IRouter } from "express";
import aiRouter from "./ai.js";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ai", aiRouter);
export default router;
