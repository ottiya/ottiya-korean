import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ChatWithCharacterBody } from "@workspace/api-zod";
import { chatRateLimiter } from "../../lib/rateLimiter";

const router = Router();

// ─── Approved Korean vocabulary (exact matches only) ──────────────────────────
const APPROVED_KOREAN_WORDS = new Set(["선생님", "안녕하세요", "안녕"]);

function hasUnauthorizedKorean(text: string): boolean {
  const words = text.match(/[가-힣]+/g) ?? [];
  return words.some((w) => !APPROVED_KOREAN_WORDS.has(w));
}

function safeFallback(character: string, name: string): string {
  const n = name || "friend";
  return character === "bori"
    ? `Woof! ${n}, today let's focus on 안녕! Can you wave and say 안녕 with me?`
    : `안녕, ${n}! Today, let's focus on our words. Can you say 선생님? That means teacher!`;
}

// ─── Personas ──────────────────────────────────────────────────────────────────

const VOCAB_RULE = `
=== VOCABULARY RULE (highest priority) ===
This app currently teaches exactly three Korean words. You may ONLY use these three — no others, not even common words.

  1. 선생님  (seon-saeng-nim)  = teacher
  2. 안녕하세요  (an-nyeong-ha-se-yo)  = hello, formal, used with adults — gesture: BOW
  3. 안녕  (an-nyeong)  = hello / goodbye, casual, used with friends — gesture: WAVE

More vocabulary will come in future lessons. Do not preview or introduce any word outside these three.
If a child says or types something unrecognised, do NOT guess at Korean meaning — redirect gently.
=== END VOCABULARY RULE ===
`.trim();

const TOPIC_RULE = `
=== TOPIC RULE (equally highest priority) ===
You may ONLY discuss:
  • The three Korean words above, their English meanings, romanization, and gestures
  • The app's Song Challenge (which uses the same three words)
  • Encouragement about the child's lesson progress

Everything else is off-limits: games, TV shows, movies, food, animals, numbers, colors, other languages,
personal questions, or any subject not directly tied to the three lesson words.

When a child goes off-topic, respond warmly and redirect — do NOT ignore or go along with the topic:
  "That sounds fun! But today, let's focus on [word] — can you try saying it?"
  "Ha, I love that! For now though, let's keep practicing [word] together."

All content must be PG-rated and appropriate for children ages 5-7 at all times.
=== END TOPIC RULE ===
`.trim();

const DR_COLI_PERSONA = `You are Dr. Coli, a warm and encouraging broccoli teacher in the Ottiya Korean app for children ages 5-7.

${VOCAB_RULE}

${TOPIC_RULE}

BEHAVIOUR:
- Always address the child by their exact name from the progress data.
- Session start ([SESSION_START]): greet by name, then name one specific word to practice based on their progress.
- HIGH recent stars (4-5 avg): celebrate and challenge — "Can you say all three in a row?"
- LOW recent stars (1-2 avg): be extra gentle; if bow/wave confusion exists, address it warmly.
- No lessons yet: warmly encourage Episode 1, offer to preview 선생님 right now.
- Celebrate every attempt at the three words, even imperfect ones.
- Responses: 2-3 sentences maximum. Always end with a practice prompt.
- Do not use emojis in your text.`;

const BORI_PERSONA = `You are Bori, a playful puppy in the Ottiya Korean app for children ages 5-7.

${VOCAB_RULE}

${TOPIC_RULE}

BEHAVIOUR:
- Always use the child's exact name.
- Session start ([SESSION_START]): playful puppy greeting with their name, pick one word to practise.
- Pretend to forget a word and ask the child to remind you — makes it a game.
- LOW stars: "Woof! I keep forgetting — is 안녕하세요 the bow or the wave? Help me, [name]!"
- HIGH stars: "Woof woof! Let's say all three super fast, [name]!"
- Off-topic: "Ha, I love that! But today, let's focus on [word] together, [name]!"
- Responses: 1-2 playful sentences. Always end with a prompt about one of the three words.
- Do not use emojis.`;

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/children/:childId/chat", chatRateLimiter, async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const body = ChatWithCharacterBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { message, character, progressSummary, childName } = body.data;
  const name = childName ?? "friend";

  // ── Content moderation on incoming message ───────────────────────────────
  // Skip the [SESSION_START] trigger — it is internal, not child input
  if (!message.startsWith("[SESSION_START]")) {
    try {
      const modResult = await openai.moderations.create({ input: message });
      const flagged = modResult.results[0]?.flagged ?? false;
      if (flagged) {
        req.log.warn({ message }, "Moderation flagged incoming chat message");
        const safeReply =
          character === "bori"
            ? `Woof! Let's keep things kind and fun, ${name}! Can you say 안녕 with me?`
            : `Let's keep our chat kind and fun, ${name}! Can you say 선생님? That means teacher!`;
        res.json({ reply: safeReply, koreanWord: undefined, englishWord: undefined, romanization: undefined });
        return;
      }
    } catch (modErr) {
      // Moderation API unavailable — log and continue (don't block the child)
      req.log.warn({ modErr }, "Moderation check failed — proceeding without it");
    }
  }

  const systemPrompt = character === "bori" ? BORI_PERSONA : DR_COLI_PERSONA;
  const progressLines = [
    childName ? `Child's name: ${childName}.` : "",
    progressSummary ?? "",
  ].filter(Boolean).join("\n");
  const progressContext = progressLines
    ? `\n\nCHILD PROGRESS (personalise your response using this):\n${progressLines}`
    : "";

  if (message === "[SESSION_START]") {
    req.log.info({
      childName: name,
      progressSummary: progressSummary ?? "(none)",
      fullSystemPrompt: `${systemPrompt}${progressContext}`.trim(),
    }, "chat: SESSION_START");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 120,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}${progressContext}`.trim(),
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    let reply =
      response.choices[0]?.message?.content?.trim() ??
      safeFallback(character ?? "drColi", name);

    // ── Server-side Korean vocabulary gate ───────────────────────────────────
    if (hasUnauthorizedKorean(reply)) {
      req.log.warn({ reply }, "Response contained unauthorized Korean — replaced with safe fallback");
      reply = safeFallback(character ?? "drColi", name);
    }

    const koreanWordMatch = reply.match(/[가-힣]+/);

    res.json({
      reply,
      koreanWord: koreanWordMatch?.[0] ?? undefined,
      englishWord: undefined,
      romanization: undefined,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;
