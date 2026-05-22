import { Router } from "express";
import { db, childProfilesTable } from "@workspace/db";

const router = Router();

router.post("/children/:childId/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { childId } = req.params;
  const body = req.body as Record<string, unknown>;

  const name = typeof body.name === "string" && body.name.length <= 64 ? body.name : undefined;
  const rawYear = body.birthYear;
  const birthYear =
    typeof rawYear === "number" && Number.isInteger(rawYear) && rawYear >= 2015 && rawYear <= 2025
      ? rawYear
      : undefined;
  const favoriteChar =
    typeof body.favoriteChar === "string" && body.favoriteChar.length <= 32
      ? body.favoriteChar
      : undefined;

  try {
    const [row] = await db
      .insert(childProfilesTable)
      .values({
        childId,
        userId: req.user.id,
        name,
        birthYear,
        favoriteChar,
      })
      .onConflictDoUpdate({
        target: childProfilesTable.childId,
        set: {
          userId: req.user.id,
          name,
          birthYear,
          favoriteChar,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;
