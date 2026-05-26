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
    req.log.info({ bufferBytes: rawBuffer.length }, "STT: received audio");
    const { buffer, format } = await ensureCompatibleFormat(rawBuffer);
    req.log.info({ format, bufferBytes: buffer.length }, "STT: sending to Whisper");
    const transcript = await speechToText(buffer, format as "wav" | "mp3" | "webm");
    req.log.info({ transcriptLength: transcript.length }, "STT: transcription complete");
    res.json({ transcript, confidence: 1.0 });
  } catch (err) {
    req.log.error({ err, message: err instanceof Error ? err.message : String(err) }, "STT: failed");
    res.status(500).json({ error: "STT failed" });
  }
});

export default router;
