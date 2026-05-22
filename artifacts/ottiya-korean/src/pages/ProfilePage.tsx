import { useState } from "react";
import { Link } from "wouter";
import { useGetChildProgress, useGetLogbookStats } from "@workspace/api-client-react";
import { useChildId } from "@/hooks/useChildId";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import { useProfilesContext, MAX_PROFILES } from "@/contexts/ProfilesContext";
import type { StoredProfile } from "@/contexts/ProfilesContext";
import { SetupOverlay } from "@/components/SetupOverlay";
import { DrColiSprite } from "@/components/DrColiSprite";
import koalaImg from "@assets/ottiya_korean_koala_1777778826131.webp";
import lionImg from "@assets/ottiya_korean_lion_1777778826131.webp";
import llamaImg from "@assets/ottiya_korean_llama_1777778826131.webp";
import pandaImg from "@assets/ottiya_korean_panda_1777778826131.webp";
import rabbitImg from "@assets/ottiya_korean_rabbit_1777778826131.webp";

const CHAR_IMAGES: Record<string, string> = {
  koala: koalaImg, lion: lionImg, llama: llamaImg, panda: pandaImg, rabbit: rabbitImg,
};
const CHAR_EMOJI: Record<string, string> = {
  koala: "🐨", lion: "🦁", llama: "🦙", panda: "🐼", rabbit: "🐰",
};
const CHAR_BG: Record<string, string> = {
  koala: "bg-yellow-100", lion: "bg-orange-100", llama: "bg-purple-100",
  panda: "bg-pink-100", rabbit: "bg-teal-100",
};

const LEVELS = [
  { name: "Little Sprout", emoji: "🌱", color: "bg-green-100 text-green-700 border-green-300",   min: 0,  max: 4  },
  { name: "Happy Chick",   emoji: "🐣", color: "bg-yellow-100 text-yellow-700 border-yellow-300", min: 5,  max: 14 },
  { name: "Star Blossom",  emoji: "🌸", color: "bg-pink-100 text-pink-700 border-pink-300",       min: 15, max: 29 },
  { name: "Shining Star",  emoji: "⭐", color: "bg-orange-100 text-orange-700 border-orange-300", min: 30, max: 49 },
  { name: "Korean Champ",  emoji: "🏆", color: "bg-purple-100 text-purple-700 border-purple-300", min: 50, max: Infinity },
];

function getLevel(stars: number) {
  return LEVELS.find(l => stars >= l.min && stars <= l.max) ?? LEVELS[0];
}

function StarGrid({ earned, total }: { earned: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`text-3xl transition-all duration-300 ${
            i < earned
              ? "opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-in zoom-in-50"
              : "opacity-20 grayscale"
          }`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

function ProfileAvatar({ profile, size = "md" }: { profile: StoredProfile; size?: "sm" | "md" | "lg" }) {
  const img = CHAR_IMAGES[profile.favorite] ?? rabbitImg;
  const bg = CHAR_BG[profile.favorite] ?? "bg-muted";
  const sizeClass = size === "sm" ? "w-10 h-10 rounded-xl" : size === "lg" ? "w-20 h-20 rounded-2xl" : "w-14 h-14 rounded-2xl";
  return (
    <div className={`${sizeClass} ${bg} overflow-hidden flex-shrink-0 border-2 border-white shadow-sm`}>
      <img src={img} alt={profile.name} className="w-full h-full object-cover" />
    </div>
  );
}

// Mini profile switcher sheet
function ProfileSwitcher({
  profiles,
  activeId,
  onSwitch,
  onAddChild,
  onClose,
  canAddMore,
}: {
  profiles: StoredProfile[];
  activeId: string;
  onSwitch: (id: string) => void;
  onAddChild: () => void;
  onClose: () => void;
  canAddMore: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-[2rem] p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-black text-foreground">Choose a Child</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold hover:bg-muted/80 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {profiles.map(p => {
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => { onSwitch(p.id); onClose(); }}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-muted bg-white shadow-sm"
                }`}
              >
                <ProfileAvatar profile={p} size="md" />
                <div className="flex-1 text-left">
                  <p className="font-black text-lg text-foreground leading-tight">{p.name}</p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {CHAR_EMOJI[p.favorite]} {p.favorite.charAt(0).toUpperCase() + p.favorite.slice(1)}
                    {p.yearOfBirth ? ` · born ${p.yearOfBirth}` : ""}
                  </p>
                </div>
                {isActive && (
                  <span className="text-primary font-black text-lg">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {canAddMore ? (
          <button
            onClick={onAddChild}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-primary/40 text-primary font-black text-lg hover:bg-primary/5 hover:border-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-2xl">+</span> Add Child
            <span className="text-sm font-bold text-muted-foreground ml-1">
              ({profiles.length}/{MAX_PROFILES})
            </span>
          </button>
        ) : (
          <p className="text-center text-sm font-bold text-muted-foreground py-2">
            Maximum {MAX_PROFILES} child profiles reached
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const childId = useChildId();
  const { profile, saveProfile } = useChildProfile();
  const { profiles, activeProfile, activeProfileId, switchProfile, addProfile, canAddMore } = useProfilesContext();
  const { data: progress, isLoading: progressLoading } = useGetChildProgress(childId);
  const { data: stats, isLoading: statsLoading } = useGetLogbookStats(childId);
  const { weekDays, streakCount } = useStreakTracker(activeProfileId);

  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name ?? "");
  const [changingChar, setChangingChar] = useState(false);

  const totalStars = progress?.totalStars ?? 0;
  const completedScenes = progress?.completedScenes ?? [];
  const songChallengesCompleted = completedScenes.filter(s => s.sceneId === "song-challenge").length;
  const episodesStarted = new Set(
    completedScenes.filter(s => s.sceneId !== "song-challenge").map(s => s.episodeId)
  ).size;
  const totalWords = stats?.totalWords ?? 0;
  const wordsThisWeek = stats?.wordsThisWeek ?? 0;

  const level = getLevel(totalStars);
  const nextLevel = LEVELS.find(l => l.min > totalStars);
  const starsToNext = nextLevel ? nextLevel.min - totalStars : 0;
  const levelProgress = nextLevel
    ? ((totalStars - level.min) / (nextLevel.min - level.min)) * 100
    : 100;

  const displayTotal = Math.min(Math.max(totalStars + 5, 10), 30);
  const isLoading = progressLoading || statsLoading;

  const handleNameSave = () => {
    if (!nameInput.trim()) return;
    saveProfile({ name: nameInput.trim(), favorite: profile?.favorite ?? "rabbit" });
    setEditingName(false);
  };

  const displayName = profile?.name ?? "Friend";
  const avatarImg = CHAR_IMAGES[profile?.favorite ?? "rabbit"];
  const avatarEmoji = CHAR_EMOJI[profile?.favorite ?? "rabbit"] ?? "🐰";

  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col overflow-hidden">

      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <Link
          href="/"
          className="bg-white px-5 py-3 rounded-full font-bold text-primary shadow-sm hover:scale-105 transition-transform border-2 border-primary/10"
        >
          Back
        </Link>
        <h1 className="text-2xl font-black text-secondary-foreground">My Stars!</h1>
        <Link
          href="/logbook"
          className="bg-white px-5 py-3 rounded-full font-bold text-secondary-foreground shadow-sm hover:scale-105 transition-transform border-2 border-secondary/20"
        >
          Logbook
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* ── Profile card — tap to open switcher ── */}
          <button
            onClick={() => setShowSwitcher(true)}
            className="bg-white rounded-[2rem] shadow-md border-4 border-primary/10 p-5 flex items-center gap-4 w-full text-left group hover:border-primary/25 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            {activeProfile && <ProfileAvatar profile={activeProfile} size="lg" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-0.5">
                Current Child
              </p>
              <p className="text-2xl font-black text-foreground truncate group-hover:text-primary transition-colors">
                {displayName}
              </p>
              <p className="text-sm font-bold text-muted-foreground mt-0.5">
                {avatarEmoji} {(profile?.favorite ?? "rabbit").charAt(0).toUpperCase() + (profile?.favorite ?? "rabbit").slice(1)}
              </p>
            </div>
            <span className="text-lg text-muted-foreground/50 group-hover:text-primary/60 transition-colors flex-shrink-0 pr-1">
              ▼
            </span>
          </button>

          {/* ── Customize Profile section ── */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">
              Customize Profile
            </p>

            {/* Inline name edit */}
            {editingName ? (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-primary p-4 flex gap-2 animate-in fade-in duration-150">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleNameSave()}
                  maxLength={20}
                  autoFocus
                  placeholder="Enter name…"
                  className="flex-1 border-2 border-primary/30 rounded-xl px-3 py-2 text-xl font-bold outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleNameSave}
                  className="bg-primary text-white font-bold px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-muted-foreground font-bold px-3 py-2 rounded-xl border-2 border-muted hover:bg-muted/30 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setNameInput(profile?.name ?? ""); setEditingName(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-muted bg-white text-foreground font-bold text-sm shadow-sm hover:border-primary hover:text-primary hover:shadow-md active:scale-95 transition-all"
                >
                  ✏️ Edit Name
                </button>
                <button
                  onClick={() => setChangingChar(c => !c)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 bg-white font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all ${
                    changingChar ? "border-primary text-primary" : "border-muted text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {avatarEmoji} Change Buddy
                </button>
              </div>
            )}

            {/* Inline character picker */}
            {changingChar && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-muted p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 text-center">
                  Pick a new buddy!
                </p>
                <div className="flex gap-2">
                  {(["koala", "lion", "llama", "panda", "rabbit"] as const).map(id => {
                    const isSelected = profile?.favorite === id;
                    const emoji = CHAR_EMOJI[id];
                    const img = CHAR_IMAGES[id];
                    const borders: Record<string, string> = {
                      koala: "border-yellow-400", lion: "border-orange-400",
                      llama: "border-purple-400", panda: "border-pink-400", rabbit: "border-teal-400",
                    };
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          saveProfile({ name: profile?.name ?? displayName, favorite: id });
                          setChangingChar(false);
                        }}
                        className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl border-4 transition-all hover:scale-105 active:scale-95 ${
                          isSelected
                            ? `${borders[id]} bg-primary/5 shadow-md scale-105`
                            : "border-muted bg-muted/30"
                        }`}
                      >
                        <img src={img} alt={id} className="w-full aspect-square object-cover rounded-xl" />
                        <span className="text-xs font-black">{emoji}</span>
                        {isSelected && <span className="text-xs">⭐</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Weekly streak card */}
          <div className="bg-white rounded-[2rem] shadow-md border-4 border-orange-100 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-secondary-foreground">Weekly Streak</h2>
              <div className="flex items-center gap-1">
                <span className="text-2xl">🔥</span>
                <span className="text-2xl font-black text-orange-500">{streakCount}</span>
                <span className="text-sm font-bold text-muted-foreground ml-0.5">
                  {streakCount === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
            <div className="flex justify-between gap-1.5">
              {weekDays.map(day => (
                <div key={day.dateStr} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                      day.active
                        ? "bg-orange-400 shadow-md shadow-orange-200 scale-110"
                        : "bg-muted/40"
                    }`}
                  >
                    {day.active ? "⭐" : ""}
                  </div>
                  <span className={`text-xs font-bold ${day.active ? "text-orange-500" : "text-muted-foreground"}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
            {streakCount === 0 && (
              <p className="text-xs text-center text-muted-foreground font-bold">
                Complete an episode today to start your streak!
              </p>
            )}
          </div>

          {/* Star count hero */}
          <div className="bg-white rounded-[2.5rem] shadow-md border-4 border-primary/10 p-8 flex flex-col items-center gap-4 text-center relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-8xl opacity-10 select-none">⭐</div>
            <div className="absolute -bottom-4 -left-4 text-8xl opacity-10 select-none">⭐</div>

            {isLoading ? (
              <div className="h-24 w-48 bg-muted animate-pulse rounded-3xl" />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-7xl font-black text-yellow-400 drop-shadow-[0_4px_6px_rgba(251,191,36,0.4)]">
                    {totalStars}
                  </span>
                  <span className="text-5xl" style={{ animation: "spin 4s linear infinite" }}>⭐</span>
                </div>
                <p className="text-xl font-bold text-muted-foreground">
                  {totalStars === 0
                    ? `Go earn your first star, ${displayName}!`
                    : totalStars === 1 ? "star earned!" : "stars earned!"}
                </p>
              </>
            )}

            {!isLoading && (
              <div className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 font-black text-xl ${level.color}`}>
                <span className="text-2xl">{level.emoji}</span>
                {level.name}
              </div>
            )}

            {!isLoading && nextLevel && (
              <div className="w-full max-w-xs flex flex-col gap-2">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(levelProgress, 4)}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {starsToNext} more ⭐ to become a {nextLevel.emoji} {nextLevel.name}!
                </p>
              </div>
            )}
            {!isLoading && !nextLevel && (
              <p className="text-lg font-black text-primary">You reached the top! 🎉</p>
            )}
          </div>

          {/* Star grid */}
          {!isLoading && totalStars > 0 && (
            <div className="bg-white rounded-[2.5rem] shadow-md border-4 border-yellow-100 p-6 flex flex-col gap-4">
              <h2 className="text-xl font-black text-center text-secondary-foreground">
                {displayName}'s Star Collection
              </h2>
              <StarGrid earned={totalStars} total={displayTotal} />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Episodes",  value: isLoading ? "..." : episodesStarted,        emoji: "📺" },
              { label: "Songs",     value: isLoading ? "..." : songChallengesCompleted, emoji: "🎵" },
              { label: "Words",     value: isLoading ? "..." : totalWords,              emoji: "📖" },
              { label: "This Week", value: isLoading ? "..." : wordsThisWeek,           emoji: "🌟" },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="bg-white rounded-[1.5rem] shadow-md border-2 border-muted p-4 flex flex-col items-center gap-1 text-center">
                <span className="text-3xl">{emoji}</span>
                <span className="text-3xl font-black text-foreground">{value}</span>
                <span className="text-sm font-bold text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Characters cheering */}
          <div className="flex items-end justify-center gap-4 pt-2">
            <div className="w-24 flex-shrink-0 rounded-2xl overflow-hidden shadow-md">
              <img src={avatarImg} alt="your buddy" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white rounded-3xl px-5 py-3 shadow-md border-2 border-primary/10 text-center mb-8 flex-1">
              <p className="font-black text-lg text-primary">
                {totalStars === 0
                  ? `Let's learn together, ${displayName}! 🎉`
                  : totalStars < 5
                  ? "Great start! Keep going! ✨"
                  : totalStars < 15
                  ? `You're amazing, ${displayName}! ✨`
                  : `Wow, ${displayName} is a star! 🌟🌟🌟`}
              </p>
            </div>
            <div className="w-28 flex-shrink-0">
              <DrColiSprite isTalking={true} />
            </div>
          </div>

        </div>
      </div>

      {/* Profile switcher sheet */}
      {showSwitcher && (
        <ProfileSwitcher
          profiles={profiles}
          activeId={activeProfileId}
          onSwitch={switchProfile}
          onAddChild={() => { setShowSwitcher(false); setShowAddChild(true); }}
          onClose={() => setShowSwitcher(false)}
          canAddMore={canAddMore}
        />
      )}

      {/* Add child onboarding flow */}
      {showAddChild && (
        <SetupOverlay
          onComplete={p => {
            addProfile(p);
            setShowAddChild(false);
          }}
        />
      )}
    </div>
  );
}
