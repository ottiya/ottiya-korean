# Threat Model

## Project Overview

Ottiya Korean is a React/Vite PWA with an Express 5 API and PostgreSQL backend for children’s Korean lessons, speech features, and progress tracking. Production traffic reaches the browser app in `artifacts/ottiya-korean` and the API in `artifacts/api-server`. The application relies on client-side child profile storage rather than a server-validated user account system, and it also exposes paid AI-backed endpoints for TTS, STT, and chat.

Assumptions for this threat model: `artifacts/mockup-sandbox` is dev-only and out of production scope unless reachability is later demonstrated; production runs with `NODE_ENV=production`; Replit-managed TLS protects traffic in transit.

## Assets

- **Child learning records** — progress history, star counts, and vocabulary logbook entries stored in PostgreSQL. These are still child-associated records and should not be readable or writable by unrelated users.
- **Conversation history** — OpenAI conversation titles and messages stored in the shared `conversations` and `messages` tables. These may contain arbitrary user-entered text and model responses.
- **Application secrets and paid API capacity** — database credentials, OpenAI integration credentials, and ElevenLabs API keys. Abuse of public endpoints can spend credits and degrade service availability even without secret disclosure.
- **Service availability** — the API accepts large JSON payloads and performs external AI calls plus ffmpeg-based transcoding, so availability depends on rejecting abusive request volume and sizes.

## Trust Boundaries

- **Browser to API** — every request from the PWA crosses into the Express API. The browser is untrusted, including all route params and request bodies.
- **API to PostgreSQL** — the API has direct read/write access to child progress, logbook, and conversation tables.
- **API to external AI providers** — `/tts`, `/stt`, `/children/:childId/chat`, and `/openai/.../messages` invoke OpenAI and/or ElevenLabs using server-held credentials and paid quotas.
- **Local profile state to server identity** — child identity originates in browser `localStorage` (`ProfilesContext` / `useChildId`) and is sent to the API as `:childId`. This boundary is especially sensitive because there is no server-issued identity proof.
- **Public versus internal/dev surfaces** — `artifacts/api-server/src/routes/**` is production-facing; `artifacts/mockup-sandbox` is dev-only by assumption.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/ottiya-korean/src/main.tsx`
- **Highest-risk server code:** `artifacts/api-server/src/routes/openai/index.ts`, `artifacts/api-server/src/routes/ottiya/{progress,logbook,chat,tts,stt}.ts`, `lib/integrations-openai-ai-server/src/audio/client.ts`
- **Public surfaces:** all routes mounted in `artifacts/api-server/src/routes/index.ts`; there is no server auth boundary today.
- **Client-derived identity surface:** `artifacts/ottiya-korean/src/contexts/ProfilesContext.tsx`, `artifacts/ottiya-korean/src/hooks/useChildId.ts`
- **Usually ignore as dev-only:** `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

The server does not currently establish a server-validated user or parent identity for production routes. Any guarantee that a caller is acting on behalf of a specific child must therefore come from a stronger mechanism than a caller-supplied `childId` or client-only UI gate. All routes that expose or mutate child-specific or conversation-specific data must require a server-verifiable principal and bind records to that principal.

### Tampering

Because the client is fully untrusted, lesson progress, logbook entries, and conversation state cannot be protected by frontend conventions alone. The API must reject writes unless the caller is authorized to modify the targeted child or conversation record, and high-cost AI endpoints must enforce server-side quotas and payload limits that reflect production abuse risk rather than just UI expectations.

### Information Disclosure

Child progress data, vocabulary logs, and stored conversation histories must not be enumerable or retrievable by unrelated callers. API responses must be scoped to the authenticated owner, and internal features or future-facing conversation endpoints must not be left globally readable just because they are not yet prominent in the UI.

### Denial of Service

The application exposes expensive public endpoints that can trigger OpenAI completions, OpenAI transcription, ElevenLabs TTS, streaming responses, and ffmpeg transcoding. Production guarantees must include rate limiting, abuse detection, conservative request-size limits, and sensible upstream timeouts so unauthenticated or low-cost attacker traffic cannot consume disproportionate compute or paid API budget.

### Elevation of Privilege

If one caller can read, append to, or delete another caller’s records by changing path parameters or integer IDs, the system has effectively granted cross-user privileges without authorization. All database-backed routes must enforce ownership checks server-side, and sequential IDs or caller-chosen identifiers must never be treated as proof of authority.