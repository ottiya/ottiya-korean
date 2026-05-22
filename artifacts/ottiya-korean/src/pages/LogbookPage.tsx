import { useState, useRef } from "react";
import { useGetLogbook, useTextToSpeech } from "@workspace/api-client-react";
import { useChildId } from "@/hooks/useChildId";
import { Link } from "wouter";
import magicBoard from "@assets/magic-board_1777770240170.webp";

const WORD_EMOJI: Record<string, string> = {
  "안녕": "👋",
  "안녕하세요": "🙇‍♀️",
};

const getWordEmoji = (korean: string) => WORD_EMOJI[korean] ?? "📖";

export default function LogbookPage() {
  const childId = useChildId();
  const { data: logbook, isLoading } = useGetLogbook(childId);
  const { mutate: tts } = useTextToSpeech();

  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uniqueLogbook = logbook?.filter((entry, index, self) =>
    index === self.findIndex((item) => item.korean === entry.korean)
  );
  const totalWords = uniqueLogbook?.length ?? 0;
  const wordsThisWeek = uniqueLogbook?.filter((entry) => {
    const addedAt = new Date(entry.addedAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return addedAt > oneWeekAgo;
  }).length ?? 0;

  const handleSpeak = (entryId: number, korean: string) => {
    if (playingId === entryId) return;
    audioRef.current?.pause();
    setPlayingId(entryId);
    tts(
      { data: { text: korean, character: "drColi" } },
      {
        onSuccess: (res) => {
          const audio = new Audio(`data:audio/mp3;base64,${res.audio}`);
          audioRef.current = audio;
          audio.play();
          audio.onended = () => setPlayingId(null);
        },
        onError: () => setPlayingId(null),
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background w-full p-4 md:p-8 flex flex-col items-center">
      
      <header className="w-full max-w-5xl flex justify-between items-center mb-6 gap-2">
        <Link href="/" className="flex-shrink-0 bg-white text-primary font-bold px-4 py-2.5 md:px-6 md:py-3 rounded-full shadow-sm border-2 border-primary/20 hover:scale-105 transition-transform text-sm md:text-base" data-testid="btn-home">
          ← Home
        </Link>
        <h1 className="text-xl md:text-3xl font-black text-secondary-foreground drop-shadow-sm text-center">My Magical Logbook</h1>
        <div className="w-16 md:w-24 flex-shrink-0" />
      </header>

      {!isLoading && (
        <div className="w-full max-w-5xl flex gap-4 mb-8">
          <div className="bg-white flex-1 p-6 rounded-3xl shadow-sm border-4 border-primary/10 text-center">
            <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Total Words</div>
            <div className="text-5xl font-black text-primary">{totalWords}</div>
          </div>
          <div className="bg-white flex-1 p-6 rounded-3xl shadow-sm border-4 border-secondary/20 text-center">
            <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Words This Week</div>
            <div className="text-5xl font-black text-secondary-foreground">{wordsThisWeek}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-2xl font-bold text-primary animate-pulse">Loading words...</div>
      ) : uniqueLogbook && uniqueLogbook.length > 0 ? (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniqueLogbook.map(entry => {
            const emoji = getWordEmoji(entry.korean);
            const isPlaying = playingId === entry.id;

            return (
              <button
                key={entry.id}
                onClick={() => handleSpeak(entry.id, entry.korean)}
                disabled={isPlaying}
                className="relative aspect-[4/3] flex flex-col items-center justify-center p-8 group hover:scale-[1.03] active:scale-[0.98] transition-transform text-left w-full"
                data-testid={`logbook-card-${entry.id}`}
              >
                <img src={magicBoard} alt="" className="absolute inset-0 w-full h-full object-fill drop-shadow-md z-0" />

                <div className="relative z-10 flex flex-col items-center text-center gap-1">
                  {/* Emoji — big and front and center */}
                  <div className={`text-5xl mb-1 transition-all duration-200 ${isPlaying ? "scale-125 animate-bounce" : "group-hover:scale-110"}`}>
                    {isPlaying ? "🔊" : emoji}
                  </div>

                  <h3 className="text-4xl font-black text-foreground">{entry.korean}</h3>
                  <p className="text-lg text-primary/80 font-bold">{entry.romanization}</p>
                  <p className="text-base text-muted-foreground font-semibold">{entry.english}</p>

                  {/* Tap-to-hear hint */}
                  <div className={`mt-2 flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 transition-all ${
                    isPlaying
                      ? "bg-violet-100 text-violet-600"
                      : "bg-white/70 text-muted-foreground group-hover:bg-violet-50 group-hover:text-violet-500"
                  }`}>
                    {isPlaying ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className="ml-1">Playing...</span>
                      </>
                    ) : (
                      <>🔊 Tap to hear</>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg">
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border-4 border-dashed border-muted-foreground/20">
            <div className="text-6xl mb-6">📖</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your logbook is empty!</h2>
            <p className="text-muted-foreground text-lg mb-8">Play episodes to learn new words and fill up your magical book.</p>
            <Link href="/" className="bg-primary text-white font-bold text-xl px-8 py-4 rounded-full inline-block shadow-md hover:scale-105 transition-transform" data-testid="btn-play">
              Go Play
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
