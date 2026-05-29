import type { LessonDefinition } from "./lessonTypes";

// ─── Lesson 1: 안녕하세요! 안녕! ─────────────────────────────────────────────
// All lesson content lives here — scenes, chat words, prompts, greetings.
// Adding a new lesson only requires adding a new LessonDefinition object.
export const LESSON_1: LessonDefinition = {
  id: "lesson-01",
  episodeId: "episode-01",
  title: "Hello! Annyeonghaseyo!",
  titleKorean: "안녕하세요! 안녕!",

  vocabulary: [
    { korean: "선생님",    english: "teacher",        romanization: "seon-saeng-nim",     emoji: "👩‍🏫" },
    { korean: "안녕하세요", english: "hello (formal)", romanization: "an-nyeong-ha-se-yo", emoji: "🙇" },
    { korean: "안녕",      english: "hello / goodbye", romanization: "an-nyeong",          emoji: "👋" },
  ],

  // ── Chat practice hub words ───────────────────────────────────────────────
  chatWords: [
    { korean: "선생님",           english: "teacher",        emoji: "👩‍🏫",    romanization: "seon-saeng-nim" },
    { korean: "안녕하세요",        english: "formal hello",   emoji: "🙇",     romanization: "an-nyeong-ha-se-yo" },
    { korean: "안녕",             english: "hello / goodbye", emoji: "👋",     romanization: "an-nyeong" },
    { korean: "안녕하세요 선생님", english: "hello, teacher", emoji: "🙇 👩‍🏫", romanization: "an-nyeong-ha-se-yo seon-saeng-nim" },
  ],

  // ── One prompt per chatWord, per character ────────────────────────────────
  // Dr. Coli (PRACTICE): warm teacher companion guiding the child through learned words.
  //   Uses short English instructions. Never frames Bori as the teacher.
  // Bori (PRACTICE): puppy friend practicing alongside the child.
  //   Mostly barks, cute sounds, and simple Korean. NOT teaching or explaining.
  characterPrompts: {
    drColi: [
      "Let's practice 선생님! That means teacher. Can you say 선생님?",
      "Now try 안녕하세요! That's the polite hello — give a little bow!",
      "Great! Now 안녕! Hello or goodbye — give a little wave!",
      "Let's put them together: 안녕하세요 선생님! Can you say it?",
    ],
    bori: [
      "선생님! 선생님! Woof!",
      "안녕하세요! 안녕하세요! Woof woof!",
      "안녕! 안녕! Woof!",
      "안녕하세요 선생님! Woof!",
    ],
  },

  // Which chatWord index each character starts on in talk mode
  chatStartIndex: { drColi: 1, bori: 0 },

  // Greeting spoken when talk mode begins
  // Dr. Coli: warm teacher companion
  // Bori: playful puppy friend — short, excited, uses only known Korean words
  greeting: {
    drColi: (name) => `안녕, ${name}! Let's practice the Korean words we're learning together.`,
    bori:   (name) => `Woof woof! 안녕, ${name}!`,
  },

  // ── Scene sequence ────────────────────────────────────────────────────────
  // Mirrors the API episode-01 scenes. `type` makes each scene self-describing.
  // The engine can render these in any future order — no rigid structure enforced.
  // ── LESSON MODE ───────────────────────────────────────────────────────────
  // Dr. Coli is the warm teacher/guide. Bori is the playful puppy learning Korean.
  // The CHILD helps teach Bori — "learning by teaching" feeling.
  // Bori uses only Korean words the child has learned or is currently learning.
  // Bori does NOT speak fluent English sentences.
  scenes: [
    {
      id: "s0-welcome",
      type: "character_intro",
      drColi: { animation: "wave", say: ["안녕! Hello, {name}!", "My name is Dr. Coli!"] },
      interaction: { type: "none" },
    },
    {
      id: "s0b-intro",
      type: "character_intro",
      drColi: { say: ["And this is Bori!"] },
      bori: { say: "Woof! Hi, {name}!" },
      interaction: { type: "none" },
    },
    {
      id: "s0b-help",
      type: "character_intro",
      drColi: { say: ["Bori is learning Korean too.", "Can you help teach her?"] },
      bori: { say: "Please?" },
      interaction: { type: "none" },
    },
    {
      id: "s1-bori-problem",
      type: "dialogue",
      drColi: { say: ["Don't worry.", "{name} can help you."] },
      bori: {
        sayBefore: ["Uh oh...", "I want to say hello in Korean.", "But I forgot how!"],
        say: "Really? Yay!",
      },
      interaction: { type: "none" },
    },
    {
      id: "s2-bori-forgot",
      type: "dialogue",
      drColi: { say: ["First, let's learn a new word.", "I am a 선생님.", "A 선생님 is a teacher."] },
      bori: { say: "선... 선... I forgot!" },
      interaction: { type: "none" },
    },
    {
      id: "s2-teach-seonsaengnim",
      type: "teach_word",
      drColi: { say: ["Say 선생님!"] },
      bori: { animation: "look", say: "Can you help me?" },
      taughtWord: { korean: "선생님", english: "teacher", romanization: "seon-saeng-nim", emoji: "👩‍🏫" },
      interaction: {
        type: "mic",
        prompt: "Say 선생님 to help Bori!",
        targetWord: "선생님",
        hint: "seon-saeng-nim",
        boriOnCorrect: "선생님! I did it!",
        onCorrectSay: ["You taught Bori!"],
        onWrongSay: ["Almost!", "Let's help Bori again.", "Say 선생님!"],
      },
    },
    {
      id: "s3-practice-seonsaengnim",
      type: "dialogue",
      drColi: { say: ["That's right!", "Now Bori knows how to say teacher."] },
      bori: { say: "선생님! 선생님! Hehe!" },
      interaction: { type: "none" },
    },
    {
      id: "s4-bigger-problem",
      type: "dialogue",
      drColi: { say: ["Hmm...", "Let's teach Bori."] },
      bori: {
        sayBefore: ["Now I know 선생님...", "But how do I say hello to my 선생님?"],
        say: "I'm ready!",
      },
      interaction: { type: "none" },
    },
    {
      id: "s5-bori-forgot",
      type: "dialogue",
      drColi: { say: ["Let's help Bori say hello politely!"] },
      bori: { say: "안... 안녕... I forgot again!" },
      interaction: { type: "none" },
    },
    {
      id: "s5-teach-annyonghaseyo",
      type: "teach_word",
      drColi: { say: ["Say 안녕하세요!"] },
      bori: { animation: "look", say: "Can you help me?" },
      taughtWord: { korean: "안녕하세요", english: "hello (formal)", romanization: "an-nyeong-ha-se-yo", emoji: "🙇" },
      interaction: {
        type: "mic",
        prompt: "Say 안녕하세요 to help Bori!",
        targetWord: "안녕하세요",
        hint: "an-nyeong-ha-se-yo",
        boriOnCorrect: "안녕하세요! Wow!",
        onCorrectSay: ["Great teaching!"],
        onWrongSay: ["Good try!", "Let's help Bori again.", "Say 안녕하세요!"],
      },
    },
    {
      id: "s6-learn-bow",
      type: "dialogue",
      drColi: { say: ["Great job!", "When we say 안녕하세요...", "We bow to show respect."] },
      interaction: { type: "none" },
    },
    {
      id: "s6-bow-demo",
      type: "dialogue",
      drColi: { animation: "bow", say: ["안녕하세요!", "Can you bow too?"] },
      bori: { animation: "bow", say: "안녕하세요!" },
      interaction: { type: "none" },
    },
    {
      id: "s6b-emoji-check-annyonghaseyo",
      type: "emoji_quiz",
      drColi: { animation: "bow", say: ["When we say 안녕하세요...", "What do we do?"] },
      bori: { animation: "bow", say: "안녕하세요?" },
      interaction: {
        type: "emoji",
        choices: ["🙇‍♀️", "👋", "🏃‍♀️"],
        correctIndex: 0,
        onCorrectSay: ["That's right! We bow.", "안녕하세요!"],
        onWrongSay: ["Almost!", "When we say 안녕하세요, we bow."],
      },
    },
    {
      id: "s7-annyong-intro",
      type: "dialogue",
      drColi: { say: ["Sometimes we say 안녕 too.", "We say 안녕 to our friends.", "Of course! Let's practice."] },
      bori: {
        sayBefore: ["Oh!"],
        say: "I want to say hello to {name}! Can we be friends?",
      },
      interaction: { type: "none" },
    },
    {
      id: "s7-teach-annyong",
      type: "teach_word",
      drColi: { say: ["Say 안녕!"] },
      bori: { animation: "look", say: "Can you help me?" },
      taughtWord: { korean: "안녕", english: "hello / goodbye", romanization: "an-nyeong", emoji: "👋" },
      interaction: {
        type: "mic",
        prompt: "Say 안녕 to help Bori!",
        targetWord: "안녕",
        hint: "an-nyeong",
        boriOnCorrect: "안녕! Hi, {name}! I'm your friend!",
        onCorrectSay: ["Amazing!"],
        onWrongSay: ["Let's try again.", "Say 안녕!"],
      },
    },
    {
      id: "s8-learn-wave",
      type: "dialogue",
      drColi: { say: ["When we say 안녕...", "We wave to our friends."] },
      interaction: { type: "none" },
    },
    {
      id: "s8-wave-demo",
      type: "dialogue",
      drColi: { animation: "wave", say: ["안녕!", "Can you wave too?"] },
      bori: { say: "안녕!" },
      interaction: { type: "none" },
    },
    {
      id: "s8b-emoji-check-annyong",
      type: "emoji_quiz",
      drColi: { animation: "wave", say: ["When we say 안녕...", "What do we do?"] },
      bori: { say: "안녕?" },
      interaction: {
        type: "emoji",
        choices: ["🙇‍♀️", "👋", "🏃‍♀️"],
        correctIndex: 1,
        onCorrectSay: ["That's right! We wave.", "안녕!"],
        onWrongSay: ["Almost!", "When we say 안녕, we wave."],
      },
    },
    {
      id: "s9-big-moment",
      type: "dialogue",
      drColi: { say: ["Bori...", "Are you ready?", "Let's say it together!"] },
      bori: {
        sayBefore: ["I think so..."],
        say: "{name}, will you help me?",
      },
      interaction: { type: "none" },
    },
    {
      id: "s9b-bow",
      type: "dialogue",
      drColi: { say: ["Bori, show {name} what you've learned!"] },
      bori: { animation: "bow", say: "안녕하세요, 선생님!" },
      interaction: { type: "none" },
    },
    {
      id: "s9c-wave",
      type: "dialogue",
      drColi: { animation: "wave", say: ["안녕, {name}!"] },
      bori: { say: "We did it! Thank you for teaching me!" },
      interaction: { type: "none" },
    },
    {
      id: "s10-memory",
      type: "celebration",
      drColi: { say: ["Great job, {name}.", "Let's learn more Korean together tomorrow!"] },
      bori: { say: "I'm so happy! Now I can say hello in Korean! And I made a new friend too." },
      interaction: { type: "none" },
    },
  ],
};

// ─── Lesson 2: 이게 뭐예요? ───────────────────────────────────────────────────
// Theme: What is this? Words: 이게 뭐예요?, 가지, 가지입니다, ㄱ (giyeok)
// Unlock: Song Challenge 1 completed with ≥70% proficiency (stars ≥ 4)
// Bori arc: masters Lesson 1 words + learns new words; combines both at the end
export const LESSON_2: LessonDefinition = {
  id: "lesson-02",
  episodeId: "episode-02",
  title: "What Is This?",
  titleKorean: "이게 뭐예요?",

  vocabulary: [
    { korean: "이게 뭐예요?", english: "What is this?",      romanization: "i-ge mwo-ye-yo",  emoji: "❓" },
    { korean: "가지",         english: "eggplant",           romanization: "ga-ji",            emoji: "🍆" },
    { korean: "가지입니다",   english: "It's an eggplant",   romanization: "ga-ji-im-ni-da",   emoji: "🍆" },
    { korean: "ㄱ",           english: "giyeok (1st letter)", romanization: "gi-yeok",          emoji: "🔤" },
  ],

  chatWords: [
    { korean: "이게 뭐예요?", english: "What is this?",    emoji: "❓", romanization: "i-ge mwo-ye-yo" },
    { korean: "가지",         english: "eggplant",         emoji: "🍆", romanization: "ga-ji" },
    { korean: "가지입니다",   english: "It's an eggplant", emoji: "🍆", romanization: "ga-ji-im-ni-da" },
  ],

  characterPrompts: {
    drColi: [
      "Great! Can you say 이게 뭐예요? That's how we ask what something is!",
      "Try saying 가지! That means eggplant — 가지!",
      "Now try the full answer — 가지입니다! That means It's an eggplant!",
    ],
    bori: [
      "이게 뭐예요? 이게 뭐예요? Woof!",
      "가지! 가지! Woof woof!",
      "가지입니다! Woof!",
    ],
  },

  chatStartIndex: { drColi: 0, bori: 1 },

  greeting: {
    drColi: (name) => `안녕, ${name}! Let's practice the words from today's lesson together!`,
    bori:   (name) => `안녕, ${name}! 이게 뭐예요? Woof woof!`,
  },

  scenes: [
    {
      id: "s0-welcome-back",
      type: "character_intro",
      drColi: {
        animation: "talk",
        say: [
          "안녕, {name}! Welcome back! Bori has been waiting for you!",
        ],
      },
      bori: { animation: "jump", say: "안녕, {name}! 안녕하세요 선생님!" },
      interaction: { type: "none" },
    },
    {
      id: "s0b-drColi-reacts",
      type: "character_intro",
      drColi: {
        animation: "talk",
        say: [
          "Oh Bori! You remembered 안녕 for friends AND 안녕하세요 for me! Excellent!",
          "Today Bori is feeling extra curious!",
        ],
      },
      bori: { animation: "jump", say: "I want to know how to say what is this?" },
      interaction: { type: "none" },
    },
    {
      id: "s1-intro-question",
      type: "dialogue",
      drColi: {
        animation: "talk",
        say: [
          "이게 뭐예요? means \"What is this?\" Let's help Bori say it!",
          "Say it with me — 이게 뭐예요?",
        ],
      },
      bori: { animation: "look", say: "이게... 뭐?" },
      interaction: { type: "none" },
    },
    {
      id: "s2-teach-question",
      type: "mic_repeat",
      drColi: {
        animation: "talk",
        say: [
          "Show Bori how! Say 이게 뭐예요?",
          "Say the whole question — 이게 뭐예요?",
        ],
      },
      bori: { animation: "look" },
      taughtWord: { korean: "이게 뭐예요?", english: '"What is this?"', romanization: "i-ge mwo-ye-yo", emoji: "❓" },
      interaction: {
        type: "mic",
        prompt: "Say 이게 뭐예요? to help Bori!",
        targetWord: "이게뭐예요",
        targets: ["이게 뭐예요", "이게뭐예요", "이게뭐야"],
        hint: "i-ge mwo-ye-yo?",
        onCorrectSay: ["이게 뭐예요? {name}, you're amazing! Bori is asking questions now!"],
        onWrongSay: ["Almost! Say it slowly — 이게 뭐예요?"],
        boriOnCorrect: "이게 뭐예요! 이게 뭐예요! Woof!",
      },
    },
    {
      id: "s3-gaji-question",
      type: "dialogue",
      drColi: {
        animation: "talk",
        say: ["Bori found something purple and shiny. 이게 뭐예요?"],
      },
      bori: { animation: "look", say: "이게 뭐예요? 🍆" },
      interaction: { type: "none" },
    },
    {
      id: "s3b-teach-gaji",
      type: "teach_word",
      drColi: {
        animation: "talk",
        say: [
          "It's a 가지! 가지 means eggplant 🍆 in Korean.",
          "Help Bori say it — 가지!",
        ],
      },
      bori: { animation: "look" },
      taughtWord: { korean: "가지", english: "eggplant", romanization: "ga-ji", emoji: "🍆" },
      interaction: {
        type: "mic",
        prompt: "Say 가지 to help Bori!",
        targetWord: "가지",
        hint: "ga-ji",
        onCorrectSay: ["가지! {name}, Bori knows her first food word! 가지! 가지!"],
        onWrongSay: ["Let's try again — 가지! Short and sweet!"],
        boriOnCorrect: "가지! 가지! Woof woof!",
      },
    },
    {
      id: "s4-emoji-gaji",
      type: "emoji_quiz",
      drColi: {
        animation: "talk",
        say: [
          "Let's help Bori find the 가지!",
          "Which one is 가지?",
        ],
      },
      bori: { animation: "look", say: "가지? 가지?" },
      interaction: {
        type: "emoji",
        choices: ["🍆", "🍅", "🌽"],
        correctIndex: 0,
        onCorrectSay: ["Yes! 가지! The purple eggplant! You did it, {name}!"],
        onWrongSay: ["Hmm! Remember — 가지 is the purple eggplant. Try again!"],
      },
    },
    {
      id: "s5-teach-answer",
      type: "teach_word",
      drColi: {
        animation: "talk",
        say: [
          "Excellent! Now let's teach Bori how to answer the question!",
          "When someone asks 이게 뭐예요? we say 가지입니다!",
          "가지입니다 means \"It's an eggplant.\" Can you say it — 가지입니다?",
        ],
      },
      bori: { animation: "look" },
      taughtWord: { korean: "가지입니다", english: '"It\'s an eggplant"', romanization: "ga-ji-im-ni-da", emoji: "🍆" },
      interaction: {
        type: "mic",
        prompt: "Say 가지입니다 to help Bori!",
        targetWord: "가지입니다",
        hint: "ga-ji-im-ni-da",
        onCorrectSay: ["가지입니다! {name}, Bori can answer questions now! You're incredible!"],
        onWrongSay: ["So close! Say it with me — 가지입니다!"],
        boriOnCorrect: "가지입니다! 가지입니다! Woof!",
      },
    },
    {
      id: "s6-bori-shines",
      type: "dialogue",
      drColi: {
        animation: "talk",
        say: ["Bori is ready to answer! Can you ask her — 이게 뭐예요?"],
      },
      bori: { animation: "look" },
      interaction: {
        type: "mic",
        prompt: "Ask Bori what it is!",
        targetWord: "이게뭐예요",
        targets: ["이게 뭐예요", "이게뭐예요", "이게뭐야"],
        hint: "i-ge mwo-ye-yo?",
        onCorrectSay: ["{name}, you asked the question! Now hear what Bori says!"],
        onWrongSay: ["Give it a try — 이게 뭐예요?"],
        boriOnCorrect: "가지입니다! Woof!",
      },
    },
    {
      id: "s7-giyeok-intro",
      type: "dialogue",
      drColi: {
        animation: "talk",
        say: [
          "One more special thing! The word 가지 starts with the letter ㄱ in Hangul — the Korean alphabet!",
          "ㄱ is the very first letter of Hangul. It looks like a little corner.",
          "Can you help Bori recognize it?",
        ],
      },
      bori: { animation: "look", say: "ㄱ! ㄱ! Woof!" },
      interaction: { type: "none" },
    },
    {
      id: "s8-emoji-giyeok",
      type: "emoji_quiz",
      drColi: {
        animation: "talk",
        say: [
          "Bori wants to find the letter ㄱ. Can you spot it?",
          "Which one is ㄱ?",
        ],
      },
      bori: { animation: "look", say: "ㄱ!" },
      interaction: {
        type: "emoji",
        choices: ["ㄱ", "🍆", "🍅"],
        choiceImages: ["/giyeok.png", null, null],
        correctIndex: 0,
        onCorrectSay: ["ㄱ! {name}, you found it! That's the first letter Bori ever learned!"],
        onWrongSay: ["Not quite! Look for the little corner shape — that's ㄱ! Try again!"],
      },
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────
// To add a new lesson: define it above and append it here.
// The chat page and practice hub will automatically pick up its words.
export const ALL_LESSONS: LessonDefinition[] = [LESSON_1, LESSON_2];

export function getLessonById(id: string): LessonDefinition | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getLessonByEpisodeId(episodeId: string): LessonDefinition | undefined {
  return ALL_LESSONS.find((l) => l.episodeId === episodeId);
}

// Lesson 1 is always unlocked by default.
export const DEFAULT_UNLOCKED_LESSON_IDS = ["lesson-01"];

// All chat words available across unlocked lessons (deduplicated by korean).
export function getAvailableChatWords(unlockedLessonIds: string[]) {
  const seen = new Set<string>();
  return ALL_LESSONS.filter((l) => unlockedLessonIds.includes(l.id))
    .flatMap((l) => l.chatWords)
    .filter((w) => {
      if (seen.has(w.korean)) return false;
      seen.add(w.korean);
      return true;
    });
}
