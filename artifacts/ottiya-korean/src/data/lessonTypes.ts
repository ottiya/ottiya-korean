// ─── Scene types ─────────────────────────────────────────────────────────────
// Each scene must declare its type explicitly.
// The lesson engine uses this to decide rendering strategy.
// Lessons can combine these in any order — no rigid intro→teach→quiz flow.
export type SceneType =
  | "character_intro"       // Special character introduction (Dr. Coli / Bori entrance)
  | "dialogue"              // Dr. Coli talks, Bori reacts — no mandatory interaction
  | "teach_word"            // Introduces a new word prominently, then mic repeat
  | "mic_repeat"            // Child repeats a word into the mic (no new word card)
  | "emoji_quiz"            // Pick the right emoji for a word
  | "tap_quiz"              // Pick from labelled options (future)
  | "mini_game"             // Embedded mini-game hook (future)
  | "celebration"           // Stars + confetti celebration
  | "review"                // Review previously learned words
  | "song_challenge"        // Embedded song challenge mini-game
  | "conversation_practice" // Free-form conversation practice
  | "animation_scene";      // Pure animation, no interaction

export type CharAnim = "talk" | "idle" | "wave" | "bow" | "jump" | "look";

// ─── Character config per scene ───────────────────────────────────────────────
export interface DrColiConfig {
  animation?: CharAnim;
  say?: string[];  // Lines of dialogue. All but the last auto-advance; last waits for tap/interaction.
}

export interface BoriConfig {
  animation?: CharAnim;
  // Short vocalizations only — Bori is NOT fluent English.
  // Early lessons: "Woof!", "Woof woof!"
  // Later lessons: known Korean words she's learned ("안녕!", "네!")
  say?: string;
}

// ─── Taught word ──────────────────────────────────────────────────────────────
export interface TaughtWord {
  korean: string;
  english: string;
  romanization: string;
  emoji?: string;
}

// ─── Interactions ─────────────────────────────────────────────────────────────
export interface MicInteraction {
  type: "mic";
  prompt?: string;
  targetWord: string;
  targets?: string[];  // alternate accepted spellings / forms
  hint: string;        // romanization shown to child
  onCorrectSay: string[];
  onWrongSay: string[];
  boriOnCorrect?: string;  // Bori speaks this AFTER the child's correct mic — "learning by teaching"
}

export interface EmojiInteraction {
  type: "emoji";
  choices: string[];
  choiceImages?: (string | null)[];  // image URL per slot; null = use the emoji string instead
  correctIndex: number;
  onCorrectSay: string[];
  onWrongSay: string[];
}

export interface NoInteraction {
  type: "none";
}

export type Interaction = MicInteraction | EmojiInteraction | NoInteraction;

// ─── Scene ────────────────────────────────────────────────────────────────────
export interface LessonScene {
  id: string;
  type: SceneType;
  drColi?: DrColiConfig;
  bori?: BoriConfig;
  taughtWord?: TaughtWord;  // only for teach_word / mic_repeat scenes
  interaction?: Interaction;
}

// ─── Chat words (used by practice hub / ChatPage) ────────────────────────────
export interface ChatWord {
  korean: string;
  english: string;
  emoji: string;
  romanization: string;
}

// ─── Full lesson definition ───────────────────────────────────────────────────
// This is the single source of truth for a lesson's:
//   - Scene sequence (rendered by EpisodePlayerPage via API)
//   - Vocabulary taught
//   - Chat practice words (rendered by ChatPage)
//   - Character prompts per word (Dr. Coli + Bori, in chatWords order)
//   - Starting word index for each character in talk mode
//   - Greeting scripts for talk mode entry
export interface LessonDefinition {
  id: string;
  episodeId: string;        // Matches the API episode id
  title: string;            // English title
  titleKorean?: string;     // Korean / mixed title shown in-app
  vocabulary: TaughtWord[]; // Canonical words taught (subset used for logbook)
  scenes: LessonScene[];    // Mirrors API episode.scenes — source of truth for structure

  // ── Chat practice hub ──
  chatWords: ChatWord[];    // Words available in the practice card grid
  characterPrompts: {
    drColi: string[];       // One prompt per chatWord (indexed)
    bori: string[];         // One prompt per chatWord (indexed) — short/simple
  };
  chatStartIndex: {
    drColi: number;         // Which chatWord index Dr. Coli starts on in talk mode
    bori: number;           // Which chatWord index Bori starts on in talk mode
  };
  greeting: {
    drColi: (childName: string) => string;
    bori:   (childName: string) => string;
  };
}
