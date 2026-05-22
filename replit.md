# Ottiya Korean

A PWA for Korean heritage kids ages 5-7 in LA/California. Features animated characters Dr. Coli (broccoli teacher) and Bori (puppy companion), episode-based lessons, STT/TTS voice interaction, AI-adaptive chat, and a vocabulary logbook.

## Architecture

pnpm workspace monorepo — TypeScript throughout.

### Artifacts
- `artifacts/ottiya-korean` — React + Vite PWA (port 21986, previewPath `/`)
- `artifacts/api-server` — Express 5 API server (port 8080, previewPath `/api`)

### Shared Libraries
- `lib/api-spec` — OpenAPI spec (`openapi.yaml`). Run codegen after changes.
- `lib/api-zod` — Generated Zod schemas from OpenAPI
- `lib/api-client-react` — Generated React Query hooks (Orval)
- `lib/db` — Drizzle ORM schema + migrations (PostgreSQL)
- `lib/integrations-openai-ai-server` — OpenAI server-side helpers (TTS, STT, chat)
- `lib/integrations-openai-ai-react` — OpenAI client-side hooks (useVoiceRecorder, useAudioPlayback)

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **TypeScript**: 5.9
- **Frontend**: React 19, Vite 7, Tailwind v4, React Query, Wouter
- **Backend**: Express 5, Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod (v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: OpenAI (gpt-5.4 for chat, nova/echo voice for TTS, gpt-4o-mini-transcribe for STT)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from OpenAPI spec (do NOT re-run unless spec changes)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## API Routes (all under /api)

- `GET /healthz`
- `GET /episodes` — list all episodes
- `GET /episodes/:id` — get episode detail with scenes
- `POST /tts` — text-to-speech (body: `{ text, character }`)
- `POST /stt` — speech-to-text (body: `{ audio: base64 }`)
- `GET /children/:childId/progress` — get child's progress
- `POST /children/:childId/progress` — save scene progress
- `GET /children/:childId/logbook` — get vocabulary logbook
- `POST /children/:childId/logbook` — add logbook entry
- `GET /children/:childId/logbook/stats` — logbook stats
- `POST /children/:childId/chat` — AI chat with Dr. Coli or Bori
- `GET/POST /openai/conversations` — conversation management
- `GET/DELETE /openai/conversations/:id` — conversation CRUD
- `GET/POST /openai/conversations/:id/messages` — message management (SSE streaming)

## Database Schema

Tables in `lib/db/src/schema/ottiya.ts`:
- `child_progress` — tracks which scenes each child has completed (childId, episodeId, sceneId, stars)
- `logbook_entries` — vocabulary words saved per child (childId, korean, english, romanization, imageUrl, episodeId)

Standard tables in `lib/db/src/schema/`:
- `conversations`, `messages` — for OpenAI conversation history

## Frontend Pages

- `/` — Home: characters + episode list + navigation
- `/episode/:id` — Episode Player: scene-by-scene with TTS, mic (STT), emoji quiz
- `/logbook` — My Magical Logbook: vocabulary flashcard collection
- `/chat` — Practice Hub: lesson word cards + talk mode with Dr. Coli/Bori

## Lesson Data Architecture

All lesson content is data-driven via `artifacts/ottiya-korean/src/data/`:
- `lessonTypes.ts` — TypeScript interfaces (`LessonDefinition`, `LessonScene`, `SceneType`, etc.)
- `lessons.ts` — Lesson registry (`LESSON_1`, `ALL_LESSONS`, `getLessonById()`, `getLessonByEpisodeId()`)

Scene types: `character_intro`, `dialogue`, `teach_word`, `mic_repeat`, `emoji_quiz`, `tap_quiz`, `mini_game`, `celebration`, `review`, `song_challenge`, `conversation_practice`, `animation_scene`

Adding a new lesson = add one `LessonDefinition` to `lessons.ts` + a matching episode in `episodes.ts`.
ChatPage reads `LESSON_1.chatWords`, `.characterPrompts`, `.chatStartIndex`, `.greeting` from the registry.
EpisodePlayerPage renders a `teach_word` word card when `scene.type === "teach_word"` on the last dialogue.

## Character Assets

- `Dr.Coli_Talk_1777770172647.png` — 30-frame sprite sheet (3914×4082px, 6 cols × 5 rows, each ~652×816px)
- `Bori_Look-1_1777770203036.png` — 13-frame sprite sheet (3975×1361px, 7 cols × 2 rows)
- All assets in `attached_assets/`, accessed via `@assets/` Vite alias

## Child ID

Child identity is stored in localStorage under `ottiya-child-id`. Hook: `useChildId()` in `artifacts/ottiya-korean/src/hooks/useChildId.ts`.

## Important Notes

- Do NOT re-run codegen unless the OpenAPI spec changes — it will overwrite all generated hooks
- Character voices: drColi → nova, bori → echo, narrator → alloy
- API body size limit is 50MB (for audio uploads)
- All mutation hooks expect `{ childId: string, data: ... }` as variables
