import { Router } from "express";

const router = Router();

// Episode data. Each scene has an explicit `type` field so the lesson engine
// can render scenes without guessing from the interaction type.
// Bori's `say` field is a short vocalization only — she is NOT fluent English.
// Early lessons: "Woof!", "Woof woof!"
// Later lessons: she repeats Korean words the child has already learned.
// LESSON MODE rules encoded in dialogue:
// - Dr. Coli is the warm teacher/guide.
// - Bori is the playful puppy learning Korean alongside the child.
// - The child helps teach Bori — "learning by teaching" feeling.
// - Bori only uses Korean words taught in this lesson. No fluent English sentences.
// - Bori can bark, gesture, react, and repeat simple Korean attempts.
const EPISODES = [
  {
    id: "episode-01",
    title: "안녕하세요! 안녕!",
    background: "bg-puppies.png",
    sceneCount: 10,
    vocabulary: ["선생님", "안녕하세요", "안녕"],
    completionMessage: "Today we learned 선생님, 안녕하세요, and 안녕!",
    scenes: [
      {
        id: "s0-welcome",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: ["안녕! Hello, {name}!", "My name is Dr. Coli!"]
        },
        interaction: { type: "none" }
      },
      {
        id: "s0b-intro",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: ["And this is Bori!", "Bori is learning Korean too.", "Can you help teach her?"]
        },
        bori: { animation: "wave", say: "Woof woof!" },
        interaction: { type: "none" }
      },
      {
        id: "s1-teach-seonsaengnim",
        type: "teach_word",
        drColi: {
          animation: "talk",
          say: ["Bori is trying to say 선생님!", "Can you help her, {name}?", "Say 선생님!"]
        },
        bori: { animation: "look", say: "선...생?" },
        taughtWord: { korean: "선생님", english: "teacher", romanization: "seon-saeng-nim", emoji: "👩‍🏫" },
        interaction: {
          type: "mic",
          prompt: "Say 선생님 to help Bori!",
          targetWord: "선생님",
          hint: "seon-saeng-nim",
          boriOnCorrect: "선생님! Woof!",
          onCorrectSay: ["You taught Bori!", "Thank you, {name}!"],
          onWrongSay: ["Almost!", "Let's help Bori again.", "선생님!"]
        }
      },
      {
        id: "s2-meet-bori",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: ["Wow!", "Bori learned a new word!"]
        },
        bori: { animation: "wave", say: "선생님!" },
        interaction: { type: "none" }
      },
      {
        id: "s2b-keep-going",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: ["You're such a great teacher, {name}.", "Let's keep going!"]
        },
        bori: { animation: "jump", say: "I want to learn more!" },
        interaction: { type: "none" }
      },
      {
        id: "s3-intro-annyonghaseyo",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: ["That's how we say hi to friends.", "But Bori wants to say hello politely to 선생님!"]
        },
        bori: { animation: "look", say: "안...녕?" },
        interaction: { type: "none" }
      },
      {
        id: "s3b-annyonghaseyo-prompt",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: ["Can you teach Bori?", "Say 안녕하세요!", "And bow a little too!"]
        },
        bori: { animation: "look", say: "안녕하세요...?" },
        interaction: { type: "none" }
      },
      {
        id: "s4-repeat-annyonghaseyo",
        type: "mic_repeat",
        bori: { animation: "bow" },
        taughtWord: { korean: "안녕하세요", english: "hello (formal)", romanization: "an-nyeong-ha-se-yo", emoji: "🙇" },
        interaction: {
          type: "mic",
          prompt: "Say 안녕하세요 to help Bori!",
          targetWord: "안녕하세요",
          hint: "an-nyeong-ha-se-yo",
          boriOnCorrect: "안녕하세요!",
          onCorrectSay: ["You did it, {name}!", "Thank you!", "Bori sounds so polite now!"],
          onWrongSay: ["Good try!", "Let's help Bori again.", "안녕하세요!"]
        }
      },
      {
        id: "s5-emoji-check-annyonghaseyo",
        type: "emoji_quiz",
        drColi: {
          animation: "talk",
          say: ["When we say 안녕하세요...", "What do we do?"]
        },
        bori: { animation: "look", say: "안녕하세요?" },
        interaction: {
          type: "emoji",
          choices: ["🙇‍♀️", "👋", "🏃‍♀️"],
          correctIndex: 0,
          onCorrectSay: ["Yes! We bow!", "Bow!", "Now Bori remembers too!"],
          onWrongSay: ["Almost!", "What do we do when we say 안녕하세요?"]
        }
      },
      {
        id: "s6-intro-annyong",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: ["That's right!", "We say 안녕 when we say hello and bye to friends!", "Can you wave and say 안녕 too?"]
        },
        bori: { animation: "wave", say: "안녕!" },
        interaction: { type: "none" }
      }
    ]
  },
  {
    id: "episode-02",
    title: "이게 뭐예요?",
    background: "bg-dinos.png",
    sceneCount: 11,
    vocabulary: ["이게 뭐예요?", "가지", "가지입니다", "ㄱ"],
    completionMessage: "Today we learned 이게 뭐예요?, 가지입니다, and ㄱ!",
    scenes: [
      {
        id: "s0-bori-greets",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: ["안녕, {name}! Welcome back! Bori has been waiting for you!"]
        },
        bori: { animation: "jump", say: "안녕, {name}! 안녕하세요 선생님!" },
        interaction: { type: "none" }
      },
      {
        id: "s0b-drColi-reacts",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: [
            "Oh Bori! You remembered 안녕 for friends AND 안녕하세요 for me! Excellent!",
            "Today Bori is feeling extra curious!"
          ]
        },
        bori: { animation: "jump", say: "I want to know how to say what is this?" },
        interaction: { type: "none" }
      },
      {
        id: "s1-intro-question",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: [
            "이게 뭐예요? means \"What is this?\" Let's help Bori say it!",
            "Say it with me — 이게 뭐예요?"
          ]
        },
        bori: { animation: "look", say: "이게... 뭐?" },
        interaction: { type: "none" }
      },
      {
        id: "s2-teach-question",
        type: "mic_repeat",
        drColi: {
          animation: "talk",
          say: [
            "Show Bori how! Say 이게 뭐예요?",
            "Say the whole question — 이게 뭐예요?"
          ]
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
          boriOnCorrect: "이게 뭐예요! 이게 뭐예요! Woof!"
        }
      },
      {
        id: "s3-gaji-question",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: ["Bori found something purple and shiny. 이게 뭐예요?"]
        },
        bori: { animation: "look", say: "이게 뭐예요? 🍆" },
        interaction: { type: "none" }
      },
      {
        id: "s3b-teach-gaji",
        type: "teach_word",
        drColi: {
          animation: "talk",
          say: [
            "It's a 가지! 가지 means eggplant 🍆 in Korean.",
            "Help Bori say it — 가지!"
          ]
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
          boriOnCorrect: "가지! 가지! Woof woof!"
        }
      },
      {
        id: "s4-emoji-gaji",
        type: "emoji_quiz",
        drColi: {
          animation: "talk",
          say: [
            "Let's help Bori find the 가지!",
            "Which one is 가지?"
          ]
        },
        bori: { animation: "look", say: "가지? 가지?" },
        interaction: {
          type: "emoji",
          choices: ["🍆", "🍅", "🌽"],
          correctIndex: 0,
          onCorrectSay: ["Yes! 가지! The purple eggplant! You did it, {name}!"],
          onWrongSay: ["Hmm! Remember — 가지 is the purple eggplant. Try again!"]
        }
      },
      {
        id: "s5-teach-answer",
        type: "teach_word",
        drColi: {
          animation: "talk",
          say: [
            "Excellent! Now let's teach Bori how to answer the question!",
            "When someone asks 이게 뭐예요? we say 가지입니다!",
            "가지입니다 means \"It's an eggplant.\" Can you say it — 가지입니다?"
          ]
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
          boriOnCorrect: "가지입니다! 가지입니다! Woof!"
        }
      },
      {
        id: "s6-bori-shines",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: ["Bori is ready to answer! Can you ask her — 이게 뭐예요?"]
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
          boriOnCorrect: "가지입니다! Woof!"
        }
      },
      {
        id: "s7-giyeok-intro",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: [
            "One more special thing! The word 가지 starts with the letter ㄱ in Hangul — the Korean alphabet!",
            "ㄱ is the very first letter of Hangul. It looks like a little corner.",
            "Can you help Bori recognize it?"
          ]
        },
        bori: { animation: "look", say: "ㄱ! ㄱ! Woof!" },
        interaction: { type: "none" }
      },
      {
        id: "s8-emoji-giyeok",
        type: "emoji_quiz",
        drColi: {
          animation: "talk",
          say: [
            "Bori wants to find the letter ㄱ. Can you spot it?",
            "Which one is ㄱ?"
          ]
        },
        bori: { animation: "look", say: "ㄱ!" },
        interaction: {
          type: "emoji",
          choices: ["ㄱ", "🍆", "🍅"],
          choiceImages: ["/giyeok.png", null, null],
          correctIndex: 0,
          onCorrectSay: ["ㄱ! {name}, you found it! That's the first letter Bori ever learned!"],
          onWrongSay: ["Not quite! Look for the little corner shape — that's ㄱ! Try again!"]
        }
      }
    ]
  }
];

router.get("/episodes", (req, res) => {
  res.json(EPISODES.map(e => ({
    id: e.id,
    title: e.title,
    sceneCount: e.sceneCount,
    vocabulary: e.vocabulary
  })));
});

router.get("/episodes/:id", (req, res) => {
  const episode = EPISODES.find(e => e.id === req.params.id);
  if (!episode) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }
  res.json(episode);
});

export default router;
