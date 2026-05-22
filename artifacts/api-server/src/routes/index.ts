import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import openaiRouter from "./openai";
import episodesRouter from "./ottiya/episodes";
import ttsRouter from "./ottiya/tts";
import sttRouter from "./ottiya/stt";
import progressRouter from "./ottiya/progress";
import logbookRouter from "./ottiya/logbook";
import chatRouter from "./ottiya/chat";
import adminRouter from "./ottiya/admin";
import adminAuthRouter from "./ottiya/adminAuth";
import childProfileRouter from "./ottiya/childProfile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(openaiRouter);
router.use(episodesRouter);
router.use(ttsRouter);
router.use(sttRouter);
router.use(progressRouter);
router.use(logbookRouter);
router.use(chatRouter);
router.use(adminRouter);
router.use(adminAuthRouter);
router.use(childProfileRouter);

export default router;
