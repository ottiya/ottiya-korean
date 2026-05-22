import { useState } from "react";
import { Link } from "wouter";
import { DrColiSprite } from "@/components/DrColiSprite";

interface Props {
  onVerified: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 100;
const MAX_YEAR = CURRENT_YEAR - 1; // include all ages so under-18 gets an error

export function ParentGateOverlay({ onVerified }: Props) {
  const [birthYear, setBirthYear] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const age = birthYear ? CURRENT_YEAR - parseInt(birthYear, 10) : null;
  const isOldEnough = age !== null && age >= 18;
  const showError = touched && birthYear !== "" && !isOldEnough;

  const years: number[] = [];
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) years.push(y);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">

      {/* Header with back button — always pinned to top */}
      <header className="p-4 flex-shrink-0">
        <Link href="/" className="bg-white px-5 py-3 rounded-full font-bold shadow-sm hover:scale-105 transition-transform border-2 border-primary/10 text-primary inline-block">
          ← Back
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Dr. Coli greeting */}
        <div className="w-40">
          <DrColiSprite isTalking={true} />
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-primary mb-2">Hey, grown-up!</h1>
          <p className="text-base font-semibold text-muted-foreground leading-snug">
            This section uses AI conversation. We need a parent or guardian to
            approve before continuing.
          </p>
        </div>

        {/* Birth year selector */}
        <div className="w-full bg-white rounded-3xl p-5 shadow-sm border-2 border-border flex flex-col gap-3">
          <label className="text-sm font-black text-foreground uppercase tracking-widest">
            What year were you born?
          </label>
          <select
            className="w-full border-2 border-border rounded-2xl px-4 py-3 text-lg font-bold bg-background outline-none focus:border-primary transition-colors"
            value={birthYear}
            onChange={(e) => {
              setBirthYear(e.target.value);
              setTouched(true);
            }}
          >
            <option value="">— select a year —</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Age confirmation or error */}
          {birthYear !== "" && (
            <p
              className={`text-sm font-bold px-1 ${
                isOldEnough ? "text-primary" : "text-destructive"
              }`}
            >
              {isOldEnough
                ? `Age ${age} — thank you!`
                : showError
                ? "This section requires a parent or guardian who is 18 or older."
                : ""}
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="w-full bg-accent/20 border-2 border-accent/40 rounded-2xl p-4 text-sm font-semibold text-foreground/80 leading-relaxed">
          <p className="font-black text-foreground mb-1">Please note:</p>
          Ottiya Korean is still in active development. While we work hard to
          keep all conversations age-appropriate and on-topic, we recommend
          staying nearby and checking in on your child's practice sessions.
          By continuing, you confirm you are a parent or guardian approving
          this session.
        </div>

        {/* Continue button */}
        <button
          disabled={!isOldEnough}
          onClick={onVerified}
          className={`w-full py-5 rounded-3xl font-black text-xl shadow-md border-b-4 transition-all ${
            isOldEnough
              ? "bg-primary text-white border-primary/40 hover:translate-y-[-2px] active:translate-y-[2px] active:border-b-0"
              : "bg-muted text-muted-foreground border-muted cursor-not-allowed"
          }`}
        >
          I understand — let's go!
        </button>

      </div>
      </div>
    </div>
  );
}
