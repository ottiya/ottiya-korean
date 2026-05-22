import { Router } from "express";
import { db } from "@workspace/db";
import { childProgressTable, logbookEntriesTable, childProfilesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/admin/analytics", async (req, res) => {
  if (!req.isAuthenticated() || req.sessionRole !== "admin") {
    res.status(403).json({ error: "Forbidden — admin access required" });
    return;
  }

  try {
    const [summary, sceneStats, topWords, dailyActivity, ageBreakdown] = await Promise.all([
      // Summary counts
      db.execute(sql`
        SELECT
          (SELECT COUNT(DISTINCT child_id) FROM ${childProgressTable})::int  AS "totalChildren",
          (SELECT COUNT(*)               FROM ${childProgressTable})::int  AS "totalCompletions",
          (SELECT ROUND(AVG(stars)::numeric, 1) FROM ${childProgressTable})::float AS "avgStarsOverall",
          (SELECT COUNT(DISTINCT child_id) FROM ${logbookEntriesTable})::int AS "totalLogbookKids",
          (SELECT COUNT(*)               FROM ${logbookEntriesTable})::int AS "totalLogbookSaves",
          (SELECT COUNT(*) FROM ${childProfilesTable} WHERE birth_year IS NOT NULL)::int AS "profilesWithAge"
      `),

      // Per-scene aggregates
      db.execute(sql`
        SELECT
          episode_id   AS "episodeId",
          scene_id     AS "sceneId",
          COUNT(DISTINCT child_id)::int        AS "uniqueKids",
          COUNT(*)::int                        AS "totalCompletions",
          ROUND(AVG(stars)::numeric, 2)::float AS "avgStars",
          MIN(completed_at)                    AS "firstSeen",
          MAX(completed_at)                    AS "lastSeen"
        FROM ${childProgressTable}
        GROUP BY episode_id, scene_id
        ORDER BY episode_id, scene_id
      `),

      // Top vocabulary words
      db.execute(sql`
        SELECT
          korean,
          english,
          romanization,
          COUNT(DISTINCT child_id)::int AS "uniqueKids",
          COUNT(*)::int                 AS "totalSaves"
        FROM ${logbookEntriesTable}
        GROUP BY korean, english, romanization
        ORDER BY "uniqueKids" DESC, "totalSaves" DESC
        LIMIT 20
      `),

      // Daily activity — last 30 days (Pacific time)
      db.execute(sql`
        SELECT
          DATE(completed_at AT TIME ZONE 'America/Los_Angeles') AS "day",
          COUNT(*)::int                   AS "completions",
          COUNT(DISTINCT child_id)::int   AS "uniqueKids"
        FROM ${childProgressTable}
        WHERE completed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(completed_at AT TIME ZONE 'America/Los_Angeles')
        ORDER BY "day" ASC
      `),

      // Age-based breakdown (children who have synced a birth year)
      db.execute(sql`
        SELECT
          (EXTRACT(YEAR FROM NOW()) - cp.birth_year)::int AS "age",
          COUNT(DISTINCT pr.child_id)::int                AS "uniqueKids",
          COUNT(*)::int                                   AS "totalCompletions",
          ROUND(AVG(pr.stars)::numeric, 1)::float         AS "avgStars",
          COUNT(DISTINCT pr.scene_id)::int                AS "uniqueScenes"
        FROM ${childProgressTable} pr
        JOIN ${childProfilesTable} cp ON cp.child_id = pr.child_id
        WHERE cp.birth_year IS NOT NULL
        GROUP BY cp.birth_year
        ORDER BY "age"
      `),
    ]);

    res.json({
      summary: summary.rows[0] ?? {},
      sceneStats: sceneStats.rows,
      topWords: topWords.rows,
      dailyActivity: dailyActivity.rows,
      ageBreakdown: ageBreakdown.rows,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
