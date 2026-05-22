import { Router } from "express";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { TextToSpeechBody } from "@workspace/api-zod";
import { ttsRateLimiter } from "../../lib/rateLimiter";

const router = Router();

const ELEVENLABS_API_KEY = process.env["ELEVENLABS_API_KEY"];
const ELEVENLABS_VOICE_ID = process.env["ELEVENLABS_VOICE_ID"];
const ELEVENLABS_BORI_VOICE_ID = process.env["ELEVENLABS_BORI_VOICE_ID"];

const CHARACTER_VOICES: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
  drColi: "nova",
  bori: "echo",
  narrator: "alloy",
};

async function textToSpeechWithElevenLabs(text: string, voiceId: string) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY ?? "",
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.85,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed with status ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

router.post("/tts", ttsRateLimiter, async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = TextToSpeechBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const voice = CHARACTER_VOICES[body.data.character] ?? "alloy";
    const audioBuffer =
      body.data.character === "drColi" && ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID
        ? await textToSpeechWithElevenLabs(body.data.text, ELEVENLABS_VOICE_ID)
        : body.data.character === "bori" && ELEVENLABS_API_KEY && ELEVENLABS_BORI_VOICE_ID
          ? await textToSpeechWithElevenLabs(body.data.text, ELEVENLABS_BORI_VOICE_ID)
        : await textToSpeech(body.data.text, voice, "mp3");
    res.json({ audio: audioBuffer.toString("base64") });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "TTS failed" });
  }
});

export default router;
