"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Users, Sparkles, Clock, BookOpen, ArrowLeft } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [timerMode, setTimerMode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("create");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: hostName.trim() || "מנהל החדר",
          timerMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה ביצירת החדר");
      localStorage.setItem(`hasmon_token_${data.code}`, data.token);
      router.push(`/room/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
      setLoading(null);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("יש להזין קוד חדר.");
      return;
    }
    setError(null);
    setLoading("join");
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: joinName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהצטרפות");
      localStorage.setItem(`hasmon_token_${data.code}`, data.token);
      router.push(`/room/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
      setLoading(null);
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      {/* Header Hero */}
      <div className="max-w-4xl w-full text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>משחק רביעיות אסטרטגי • 48 קלפים • 12 רביעיות מקוריות</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight gold-gradient-text mb-3">
          החשמונאים באים
        </h1>
        <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
          עבודת חקר בהיסטוריה — כיתה י&apos;3, תיכון עירוני ה&apos; מודיעין.
          <br className="hidden sm:inline" /> פתחו חדר משחק, סרקו את קוד ה־QR מהטלפונים ושחקו אונליין בזמן אמת.
        </p>
      </div>

      {/* Card Fan Preview */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-9 select-none">
        {[
          { src: "/cards/card_02.webp", rot: "-rotate-6", alt: "ירושלים" },
          { src: "/cards/card_08.webp", rot: "-rotate-2", alt: "אלכסנדר ינאי" },
          { src: "/cards/back.webp", rot: "rotate-0 scale-105 z-10", alt: "גב המנורה" },
          { src: "/cards/card_27.webp", rot: "rotate-2", alt: "חנוכה" },
          { src: "/cards/card_30.webp", rot: "rotate-6", alt: "מנורת המקדש" },
        ].map((c, idx) => (
          <div
            key={idx}
            className={`w-16 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden card-shadow transition-transform duration-300 hover:scale-110 hover:z-20 ${c.rot}`}
          >
            <img src={c.src} alt={c.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {error && (
        <div className="max-w-3xl w-full mb-5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      {/* Two Main Cards: Create Room & Join Room */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Room */}
        <form
          onSubmit={handleCreate}
          className="rounded-2xl bg-slate-900/80 backdrop-blur-md border border-amber-400/30 p-6 sm:p-7 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-200">פתיחת חדר חדש</h2>
                <p className="text-xs text-slate-400">מנהל החדר מקבל קוד QR להצטרפות</p>
              </div>
            </div>

            <label className="block text-sm text-slate-300 mb-1.5 font-medium">
              השם שלך (מנהל החדר)
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="לדוגמה: יובל"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-amber-400 focus:outline-none text-white mb-4"
            />

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:border-amber-400/40 transition mb-5">
              <input
                type="checkbox"
                checked={timerMode}
                onChange={(e) => setTimerMode(e.target.checked)}
                className="w-4 h-4 accent-amber-400"
              />
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-slate-200">משחק כיתתי קצר (טיימר 15 דקות)</span>
                <p className="text-slate-400 text-xs">כבוי = משחק מלא עד 12 רביעיות</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading !== null}
            className="w-full py-3.5 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === "create" ? "פותח חדר..." : "פתח חדר וקבל קוד QR"}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Join Room */}
        <form
          onSubmit={handleJoin}
          className="rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 p-6 sm:p-7 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">הצטרפות לחדר קיים</h2>
                <p className="text-xs text-slate-400">הזינו קוד חדר או סרקו QR מהמסך</p>
              </div>
            </div>

            <label className="block text-sm text-slate-300 mb-1.5 font-medium">
              קוד חדר (6 תווים)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="לדוגמה: A7K9P2"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-400 focus:outline-none text-white text-center font-mono tracking-widest text-lg uppercase mb-4"
            />

            <label className="block text-sm text-slate-300 mb-1.5 font-medium">
              השם שלך
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="השם שיופיע לשאר השחקנים"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-400 focus:outline-none text-white mb-5"
            />
          </div>

          <button
            type="submit"
            disabled={loading !== null}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-sky-400/40 text-sky-200 font-bold text-base transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === "join" ? "מצטרף..." : "הצטרף למשחק"}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          מבוסס על עבודת החקר על אלכסנדר ינאי ותקופת החשמונאים
        </span>
        <span>•</span>
        <span>2–4 שחקנים • מגישים: יובל קרין, יהלי בראונשטיין, ינאי גוטסמן, נועם זסי, כפיר כהן, הילל ארבלי</span>
      </div>
    </main>
  );
}
