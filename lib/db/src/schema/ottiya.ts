import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const childProgressTable = pgTable("child_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  childId: text("child_id").notNull(),
  episodeId: text("episode_id").notNull(),
  sceneId: text("scene_id").notNull(),
  stars: integer("stars").notNull().default(1),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertChildProgressSchema = createInsertSchema(childProgressTable).omit({ id: true, completedAt: true });
export type InsertChildProgress = z.infer<typeof insertChildProgressSchema>;
export type ChildProgress = typeof childProgressTable.$inferSelect;

export const logbookEntriesTable = pgTable("logbook_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  childId: text("child_id").notNull(),
  korean: text("korean").notNull(),
  english: text("english").notNull(),
  romanization: text("romanization").notNull(),
  imageUrl: text("image_url"),
  episodeId: text("episode_id"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertLogbookEntrySchema = createInsertSchema(logbookEntriesTable).omit({ id: true, addedAt: true });
export type InsertLogbookEntry = z.infer<typeof insertLogbookEntrySchema>;
export type LogbookEntry = typeof logbookEntriesTable.$inferSelect;

export const childProfilesTable = pgTable("child_profiles", {
  childId: text("child_id").primaryKey(),
  userId: text("user_id"),
  name: text("name"),
  birthYear: integer("birth_year"),
  favoriteChar: text("favorite_char"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ChildProfileRow = typeof childProfilesTable.$inferSelect;

export const wordAttemptsTable = pgTable("word_attempts", {
  id: serial("id").primaryKey(),
  childId: text("child_id").notNull(),
  korean: text("korean").notNull(),
  correct: boolean("correct").notNull(),
  episodeId: integer("episode_id"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertWordAttemptSchema = createInsertSchema(wordAttemptsTable).omit({ id: true, attemptedAt: true });
export type InsertWordAttempt = z.infer<typeof insertWordAttemptSchema>;
export type WordAttempt = typeof wordAttemptsTable.$inferSelect;

export const episodeCompletionsTable = pgTable("episode_completions", {
  id: serial("id").primaryKey(),
  childId: text("child_id").notNull(),
  episodeId: integer("episode_id").notNull(),
  songScore: integer("song_score"),
  totalCues: integer("total_cues"),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertEpisodeCompletionSchema = createInsertSchema(episodeCompletionsTable).omit({ id: true, completedAt: true });
export type InsertEpisodeCompletion = z.infer<typeof insertEpisodeCompletionSchema>;
export type EpisodeCompletion = typeof episodeCompletionsTable.$inferSelect;
