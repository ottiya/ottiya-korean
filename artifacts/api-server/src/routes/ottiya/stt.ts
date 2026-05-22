import { Router } from "express";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";
import { SpeechToTextBody } from "@workspace/api-zod";
import { sttRateLimiter } from "../../lib/rateLimiter";

const router = Router();

router.post("/stt", sttRateLimiter, async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = SpeechToTextBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const rawBuffer = Buffer.from(body.data.audio, "base64");
    const { buffer, format } = await ensureCompatibleFormat(rawBuffer);
    const transcript = await speechToText(buffer, format as "wav" | "mp3" | "webm");
    res.json({ transcript, confidence: 1.0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "STT failed" });
  }
});

export default router;
