import { Router } from "express";
import { db } from "@workspace/db";
import { childProgressTable, wordAttemptsTable, episodeCompletionsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { SaveChildProgressBody } from "@workspace/api-zod";

const router = Router();

router.get("/children/:childId/progress", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const userId = req.user.id;
  try {
    const completedScenes = await db
      .select()
      .from(childProgressTable)
      .where(and(
        eq(childProgressTable.childId, childId),
        eq(childProgressTable.userId, userId),
      ))
      .orderBy(childProgressTable.completedAt);

    const episodeIds = [...new Set(completedScenes.map(s => s.episodeId))];
    const totalStars = completedScenes.reduce((sum, s) => sum + s.stars, 0);

    res.json({
      childId,
      completedScenes,
      episodesStarted: episodeIds.length,
      episodesCompleted: 0,
      totalStars,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get progress" });
  }
});

router.post("/children/:childId/progress", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const userId = req.user.id;
  const body = SaveChildProgressBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [entry] = await db
      .insert(childProgressTable)
      .values({
        userId,
        childId,
        episodeId: body.data.episodeId,
        sceneId: body.data.sceneId,
        stars: body.data.stars,
      })
      .returning();
    res.json(entry);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

router.post("/children/:childId/word-attempts", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const { korean, correct, episodeId } = req.body;
  if (typeof korean !== "string" || typeof correct !== "boolean") {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [entry] = await db
      .insert(wordAttemptsTable)
      .values({
        childId,
        korean,
        correct,
        episodeId: typeof episodeId === "number" ? episodeId : null,
      })
      .returning();
    res.json(entry);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save word attempt" });
  }
});

router.post("/children/:childId/episode-completions", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const { episodeId, songScore, totalCues } = req.body;
  if (typeof episodeId !== "number") {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [entry] = await db
      .insert(episodeCompletionsTable)
      .values({
        childId,
        episodeId,
        songScore: typeof songScore === "number" ? songScore : null,
        totalCues: typeof totalCues === "number" ? totalCues : null,
      })
      .returning();
    res.json(entry);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save episode completion" });
  }
});

router.get("/children/:childId/history", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  try {
    const wordHistory = await db
      .select({
        korean: wordAttemptsTable.korean,
        correct: sql<number>`count(*) filter (where ${wordAttemptsTable.correct} = true)`.mapWith(Number),
        incorrect: sql<number>`count(*) filter (where ${wordAttemptsTable.correct} = false)`.mapWith(Number),
        total: sql<number>`count(*)`.mapWith(Number),
      })
      .from(wordAttemptsTable)
      .where(eq(wordAttemptsTable.childId, childId))
      .groupBy(wordAttemptsTable.korean);

    const episodeHistory = await db
      .select()
      .from(episodeCompletionsTable)
      .where(eq(episodeCompletionsTable.childId, childId))
      .orderBy(desc(episodeCompletionsTable.completedAt));

    res.json({ wordHistory, episodeHistory });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get history" });
  }
});

export default router;
