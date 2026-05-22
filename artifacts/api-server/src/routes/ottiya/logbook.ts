import { Router } from "express";
import { db } from "@workspace/db";
import { logbookEntriesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { AddLogbookEntryBody } from "@workspace/api-zod";

const router = Router();

router.get("/children/:childId/logbook", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const userId = req.user.id;
  try {
    const entries = await db
      .select()
      .from(logbookEntriesTable)
      .where(and(
        eq(logbookEntriesTable.childId, childId),
        eq(logbookEntriesTable.userId, userId),
      ))
      .orderBy(desc(logbookEntriesTable.addedAt));
    res.json(entries);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get logbook" });
  }
});

router.post("/children/:childId/logbook", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const userId = req.user.id;
  const body = AddLogbookEntryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [entry] = await db
      .insert(logbookEntriesTable)
      .values({ userId, childId, ...body.data })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add logbook entry" });
  }
});

router.get("/children/:childId/logbook/stats", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { childId } = req.params;
  const userId = req.user.id;
  try {
    const allEntries = await db
      .select()
      .from(logbookEntriesTable)
      .where(and(
        eq(logbookEntriesTable.childId, childId),
        eq(logbookEntriesTable.userId, userId),
      ))
      .orderBy(desc(logbookEntriesTable.addedAt));

    const uniqueByWord = allEntries.reduce<typeof allEntries>((acc, entry) => {
      if (!acc.some(item => item.korean === entry.korean)) acc.push(entry);
      return acc;
    }, []);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const uniqueWordsThisWeek = uniqueByWord.filter(e => new Date(e.addedAt) > oneWeekAgo).length;

    res.json({
      totalWords: uniqueByWord.length,
      wordsThisWeek: uniqueWordsThisWeek,
      recentWords: uniqueByWord.slice(0, 5),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get logbook stats" });
  }
});

export default router;
