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
    sceneCount: 7,
    vocabulary: ["선생님", "안녕하세요", "안녕"],
    completionMessage: "Today we learned 선생님, 안녕하세요, and 안녕!",
    scenes: [
      {
        id: "s0-welcome",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: [
            "안녕! Hello, {name}! I'm Dr. Coli — your 선생님, your teacher!",
            "And this is Bori, my puppy friend!",
            "Bori is learning Korean just like you. Can you help teach her?"
          ]
        },
        bori: { animation: "wave", say: "Woof woof!" },
        interaction: { type: "none" }
      },
      {
        id: "s1-teach-seonsaengnim",
        type: "teach_word",
        drColi: {
          animation: "talk",
          say: [
            "Bori doesn't know how to say teacher in Korean yet!",
            "The word is 선생님.",
            "Can you help teach Bori? Say it out loud — 선생님!"
          ]
        },
        bori: { animation: "look", say: "선...생?" },
        taughtWord: { korean: "선생님", english: "teacher", romanization: "seon-saeng-nim", emoji: "👩‍🏫" },
        interaction: {
          type: "mic",
          prompt: "Say 선생님 to help Bori learn!",
          targetWord: "선생님",
          hint: "seon-saeng-nim",
          onCorrectSay: ["선생님! Great job, {name}! Bori is learning because of you!"],
          onWrongSay: ["Almost! Let's try again — 선생님!"]
        }
      },
      {
        id: "s2-meet-bori",
        type: "character_intro",
        drColi: {
          animation: "talk",
          say: [
            "Bori learned 선생님 because of you!",
            "You're such a great teacher!",
            "Let's keep going — Bori wants to learn more!"
          ]
        },
        bori: { animation: "wave", say: "선생님! Woof!" },
        interaction: { type: "none" }
      },
      {
        id: "s3-intro-annyonghaseyo",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: [
            "Bori wants to say hello politely to grown-ups!",
            "Can you help Bori say 안녕하세요?",
            "We bow a little when we say it — like this!"
          ]
        },
        bori: { animation: "bow", say: "안...녕?" },
        interaction: { type: "none" }
      },
      {
        id: "s4-repeat-annyonghaseyo",
        type: "mic_repeat",
        drColi: {
          animation: "bow",
          say: [
            "Show Bori how! Say 안녕하세요!",
            "Give a little bow too!"
          ]
        },
        bori: { animation: "bow", say: "안녕하세요!" },
        taughtWord: { korean: "안녕하세요", english: "hello (formal)", romanization: "an-nyeong-ha-se-yo", emoji: "🙇" },
        interaction: {
          type: "mic",
          prompt: "Say 안녕하세요 to help Bori!",
          targetWord: "안녕하세요",
          hint: "an-nyong-ha-se-yo",
          onCorrectSay: ["안녕하세요! You're amazing, {name}! Bori is so happy you helped her!"],
          onWrongSay: ["Great try! One more time — 안녕하세요!"]
        }
      },
      {
        id: "s5-emoji-check-annyonghaseyo",
        type: "emoji_quiz",
        drColi: {
          animation: "talk",
          say: [
            "Bori is confused! Help her out.",
            "When we say 안녕하세요, what do we do?"
          ]
        },
        bori: { animation: "look", say: "안녕하세요?" },
        interaction: {
          type: "emoji",
          choices: ["🙇‍♀️", "👋", "🏃‍♀️"],
          correctIndex: 0,
          onCorrectSay: ["Yes! We bow! Now Bori knows too — because of you!"],
          onWrongSay: ["Hmm, not quite! What do we do when we say 안녕하세요?"]
        }
      },
      {
        id: "s6-intro-annyong",
        type: "dialogue",
        drColi: {
          animation: "talk",
          say: [
            "One more word for Bori to learn!",
            "When you see your friends, you say 안녕! And wave!",
            "Can you show Bori how?"
          ]
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
