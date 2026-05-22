import { useState } from "react";
import { type ChildProfile, type FavoriteChar } from "@/hooks/useChildProfile";
import koalaImg from "@assets/ottiya_korean_koala_1777778826131.webp";
import lionImg from "@assets/ottiya_korean_lion_1777778826131.webp";
import llamaImg from "@assets/ottiya_korean_llama_1777778826131.webp";
import pandaImg from "@assets/ottiya_korean_panda_1777778826131.webp";
import rabbitImg from "@assets/ottiya_korean_rabbit_1777778826131.webp";

interface CharDef {
  id: FavoriteChar;
  emoji: string;
  label: string;
  image: string;
  names: string[];
  selBorder: string;
  selBg: string;
}

const CHARACTERS: CharDef[] = [
  { id: "koala",  emoji: "🐨", label: "Koala",  image: koalaImg,  names: ["코코", "모모", "코비"], selBorder: "border-yellow-400", selBg: "bg-yellow-50" },
  { id: "lion",   emoji: "🦁", label: "Lion",   image: lionImg,   names: ["루루", "레오", "라라"], selBorder: "border-orange-400", selBg: "bg-orange-50" },
  { id: "llama",  emoji: "🦙", label: "Llama",  image: llamaImg,  names: ["라미", "미미", "로로"], selBorder: "border-purple-400", selBg: "bg-purple-50" },
  { id: "panda",  emoji: "🐼", label: "Panda",  image: pandaImg,  names: ["포포", "단이", "보보"], selBorder: "border-pink-400",   selBg: "bg-pink-50"   },
  { id: "rabbit", emoji: "🐰", label: "Rabbit", image: rabbitImg, names: ["토토", "바니", "핑핑"], selBorder: "border-teal-400",  selBg: "bg-teal-50"  },
];

// One random name per animal, computed once on module load
const SUGGESTION_CHIPS = CHARACTERS.map(c => ({
  name: c.names[Math.floor(Math.random() * c.names.length)],
  emoji: c.emoji,
}));
const PLACEHOLDER_NAME = SUGGESTION_CHIPS[Math.floor(Math.random() * SUGGESTION_CHIPS.length)].name;

// Ages 3–12: currentYear-3 down to currentYear-12, updates automatically each year
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 3 - i);

interface SetupOverlayProps {
  onComplete: (profile: ChildProfile) => void;
}

export function SetupOverlay({ onComplete }: SetupOverlayProps) {
  const [name, setName] = useState("");
  const [favorite, setFavorite] = useState<FavoriteChar | null>(null);
  const [yearOfBirth, setYearOfBirth] = useState<number | null>(null);
  const [step, setStep] = useState<"name" | "character" | "year">("name");
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherYearInput, setOtherYearInput] = useState("");

  const handleNameNext = () => {
    if (name.trim().length === 0) return;
    setStep("character");
  };

  const handleCharNext = () => {
    if (!favorite) return;
    setStep("year");
  };

  const handleDone = () => {
    if (!favorite) return;
    onComplete({ name: name.trim(), favorite, yearOfBirth: yearOfBirth ?? undefined });
  };

  const selectedChar = CHARACTERS.find(c => c.id === favorite);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm px-6 overflow-y-auto py-8">

      {/* ── STEP 1: NAME ── */}
      {step === "name" && (
        <div className="flex flex-col items-center gap-5 w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-500">

          <div className="bg-white rounded-3xl px-8 py-6 shadow-xl border-4 border-primary/10 text-center w-full">
            <p className="text-3xl font-black text-primary mb-1">안녕!</p>
            <p className="text-xl font-bold text-foreground mb-1">What's your name?</p>
            <p className="text-base text-muted-foreground">(Ask a grown-up to help!)</p>
          </div>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleNameNext()}
            placeholder={`${PLACEHOLDER_NAME}...`}
            maxLength={20}
            className="w-full bg-white border-4 border-primary/30 focus:border-primary rounded-2xl px-6 py-5 text-2xl font-bold text-center outline-none shadow-md placeholder:text-muted-foreground/50 transition-colors"
            autoFocus
          />

          <div className="flex flex-col items-center gap-2 w-full">
            <p className="text-sm font-bold text-muted-foreground">Or try a cute Korean name!</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTION_CHIPS.map(chip => (
                <button
                  key={chip.name}
                  onClick={() => setName(chip.name)}
                  className={`px-4 py-2 rounded-full font-black text-lg border-2 transition-all hover:scale-105 active:scale-95 ${
                    name === chip.name
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-white border-muted text-foreground shadow-sm"
                  }`}
                >
                  {chip.emoji} {chip.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNameNext}
            disabled={name.trim().length === 0}
            className="w-full bg-primary text-white font-black text-2xl py-5 rounded-3xl shadow-lg border-b-4 border-primary-foreground/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── STEP 2: CHARACTER ── */}
      {step === "character" && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">

          <div className="bg-white rounded-3xl px-8 py-5 shadow-xl border-4 border-primary/10 text-center">
            <p className="text-2xl font-black text-foreground">
              Hi, <span className="text-primary">{name}</span>! 👋
            </p>
            <p className="text-xl font-bold text-muted-foreground mt-1">Pick your buddy!</p>
          </div>

          <div className="flex gap-2 w-full">
            {CHARACTERS.map(c => {
              const isSelected = favorite === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFavorite(c.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-3xl border-4 transition-all hover:scale-105 active:scale-95 ${
                    isSelected
                      ? `${c.selBorder} ${c.selBg} shadow-lg scale-105`
                      : "border-muted bg-white shadow-sm"
                  }`}
                >
                  <img
                    src={c.image}
                    alt={c.label}
                    className="w-full aspect-square object-cover rounded-2xl"
                  />
                  <span className="font-black text-xs text-foreground leading-tight text-center">
                    {c.emoji} {c.label}
                  </span>
                  {isSelected && <span className="text-base">⭐</span>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setStep("name")}
              className="flex-shrink-0 bg-white text-muted-foreground font-bold px-6 py-4 rounded-2xl border-2 border-muted hover:scale-105 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleCharNext}
              disabled={!favorite}
              className="flex-1 bg-primary text-white font-black text-2xl py-4 rounded-3xl shadow-lg border-b-4 border-primary-foreground/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: YEAR OF BIRTH ── */}
      {step === "year" && (
        <div className="flex flex-col items-center gap-5 w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-500">

          <div className="bg-white rounded-3xl px-8 py-6 shadow-xl border-4 border-primary/10 text-center w-full">
            <p className="text-4xl mb-2">🎂</p>
            <p className="text-2xl font-black text-foreground mb-1">Choose your child's birth year</p>
            <div className="inline-flex items-center gap-2 mt-2 bg-yellow-50 border-2 border-yellow-200 rounded-2xl px-4 py-2">
              <span className="text-xl">🧑‍🍼</span>
              <p className="text-sm font-bold text-yellow-800">Ask a grown-up for help!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {YEAR_OPTIONS.map(year => (
              <button
                key={year}
                onClick={() => setYearOfBirth(year)}
                className={`py-4 rounded-2xl font-black text-2xl border-4 transition-all hover:scale-105 active:scale-95 shadow-sm ${
                  yearOfBirth === year
                    ? "bg-primary text-white border-primary shadow-lg scale-105"
                    : "bg-white border-muted text-foreground"
                }`}
              >
                {year}
              </button>
            ))}
            <button
              onClick={() => { setOtherYearInput(""); setShowOtherModal(true); }}
              className={`col-span-2 py-4 rounded-2xl font-black text-xl border-4 transition-all hover:scale-105 active:scale-95 shadow-sm ${
                yearOfBirth !== null && !YEAR_OPTIONS.includes(yearOfBirth)
                  ? "bg-primary text-white border-primary shadow-lg"
                  : "bg-white border-dashed border-muted text-muted-foreground"
              }`}
            >
              {yearOfBirth !== null && !YEAR_OPTIONS.includes(yearOfBirth)
                ? `✏️ ${yearOfBirth}`
                : "✏️ Other"}
            </button>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setStep("character")}
              className="flex-shrink-0 bg-white text-muted-foreground font-bold px-6 py-4 rounded-2xl border-2 border-muted hover:scale-105 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleDone}
              className="flex-1 bg-primary text-white font-black text-2xl py-4 rounded-3xl shadow-lg border-b-4 border-primary-foreground/20 hover:scale-105 active:scale-95 transition-all"
            >
              {yearOfBirth ? "Let's Play! 🎉" : "Skip →"}
            </button>
          </div>
        </div>
      )}

      {/* ── OTHER YEAR MODAL ── */}
      {showOtherModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowOtherModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-xs shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-xl font-black text-foreground">Please enter birth year</p>
            </div>

            <input
              type="number"
              inputMode="numeric"
              value={otherYearInput}
              onChange={e => setOtherYearInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const y = parseInt(otherYearInput, 10);
                  if (y >= 1900 && y <= CURRENT_YEAR) {
                    setYearOfBirth(y);
                    setShowOtherModal(false);
                  }
                }
              }}
              placeholder={String(CURRENT_YEAR - 6)}
              min={1900}
              max={CURRENT_YEAR}
              className="w-full bg-white border-4 border-primary/30 focus:border-primary rounded-2xl px-5 py-4 text-3xl font-black text-center outline-none shadow-md placeholder:text-muted-foreground/40 transition-colors"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowOtherModal(false)}
                className="flex-shrink-0 bg-muted text-muted-foreground font-bold px-5 py-3 rounded-2xl border-2 border-muted hover:scale-105 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const y = parseInt(otherYearInput, 10);
                  if (y >= 1900 && y <= CURRENT_YEAR) {
                    setYearOfBirth(y);
                    setShowOtherModal(false);
                  }
                }}
                disabled={(() => { const y = parseInt(otherYearInput, 10); return !(y >= 1900 && y <= CURRENT_YEAR); })()}
                className="flex-1 bg-primary text-white font-black text-xl py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
              >
                Confirm ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
