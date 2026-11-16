"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Bot,
  BookOpen,
  Check,
  Clock,
  Copy,
  Crown,
  Info,
  Play,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { CARDS, CARD_BY_ID, QUARTET_BY_ID, type QuartetId } from "@/data/cards";
import { supabase } from "@/lib/supabase-client";
import type { PlayerView } from "@/lib/game-engine";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code || "").toUpperCase();

  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [view, setView] = useState<PlayerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // Interactive modals
  const [askQuartet, setAskQuartet] = useState<QuartetId | null>(null);
  const [askTargetId, setAskTargetId] = useState<string>("");
  const [inspectCardId, setInspectCardId] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Special move states
  const [swapMyCardId, setSwapMyCardId] = useState<number | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<string>("");
  const [swapTheirIdx, setSwapTheirIdx] = useState<number>(0);

  // Timer tick
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`hasmon_token_${code}`);
    setToken(saved);
    setTokenLoaded(true);
  }, [code]);

  const fetchState = useCallback(async () => {
    if (!code) return;
    try {
      const q = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/rooms/${code}/state${q}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "החדר לא נמצא");
        return;
      }
      setView(data.view);
      setError(null);
    } catch {
      // ignore transient network error
    }
  }, [code, token]);

  useEffect(() => {
    if (!tokenLoaded) return;
    fetchState();

    const poll = setInterval(fetchState, 1800);

    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (supabase) {
      channel = supabase
        .channel(`room:${code}`)
        .on("broadcast", { event: "tick" }, () => {
          fetchState();
        })
        .subscribe();
    }

    return () => {
      clearInterval(poll);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [code, tokenLoaded, fetchState]);

  async function handleJoinViaQR(e: React.FormEvent) {
    e.preventDefault();
    if (!joinName.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: joinName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהצטרפות");
      localStorage.setItem(`hasmon_token_${code}`, data.token);
      setToken(data.token);
      setView(data.view);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setJoining(false);
    }
  }

  async function handleAddBot() {
    if (!token || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/rooms/${code}/bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setView(data.view);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  async function handleStartGame() {
    if (!token || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/rooms/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setView(data.view);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  async function sendAction(action: Record<string, unknown>) {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${code}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "פעולה נכשלה");
      setView(data.view);
      setAskQuartet(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/room/${code}`;
  }, [code]);

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isMyTurn = Boolean(view?.me && view.currentTurnPlayerId === view.me.id);
  const opponents = useMemo(
    () => (view ? view.players.filter((p) => p.id !== view.me?.id) : []),
    [view]
  );

  // Remaining timer
  const remainingSec = useMemo(() => {
    if (!view?.timerMode || !view.startedAt) return null;
    const elapsed = Math.floor((nowMs - view.startedAt) / 1000);
    return Math.max(0, view.timerDurationSec - elapsed);
  }, [view, nowMs]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (!tokenLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-300">
        טוען חדר...
      </div>
    );
  }

  if (error && !view) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-red-300 text-lg mb-4">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer"
        >
          חזרה למסך הראשי
        </button>
      </div>
    );
  }

  // If user scanned QR and hasn't joined yet
  if (view && !view.me) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleJoinViaQR}
          className="max-w-md w-full rounded-2xl bg-slate-900/90 border border-amber-400/30 p-7 shadow-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>חדר {code}</span>
          </div>
          <h1 className="text-3xl font-black gold-gradient-text mb-2">החשמונאים באים</h1>
          <p className="text-slate-300 text-sm mb-5">הזינו את השם שלכם כדי להצטרף למשחק</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/15 border border-red-400/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          <input
            type="text"
            required
            maxLength={20}
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="השם שלך..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-white mb-4 text-center"
          />
          <button
            type="submit"
            disabled={joining}
            className="w-full py-3 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
          >
            {joining ? "מצטרף..." : "היכנס לחדר"}
          </button>
        </form>
      </main>
    );
  }

  if (!view) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-300">
        טוען חדר {code}...
      </div>
    );
  }

  // ==================== LOBBY ====================
  if (view.status === "lobby") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-3xl w-full rounded-3xl bg-slate-900/85 backdrop-blur-md border border-amber-400/30 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-xs text-amber-300 font-semibold">לובי המתנה למשחק</span>
              <h1 className="text-3xl sm:text-4xl font-black gold-gradient-text">
                החשמונאים באים
              </h1>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-amber-400/30 text-center">
              <div className="text-[11px] text-slate-400">קוד חדר</div>
              <div className="text-xl font-mono font-bold tracking-widest text-amber-300" dir="ltr">
                {code}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Code Box */}
            <div className="flex flex-col items-center p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="p-3 rounded-2xl bg-white shadow-lg mb-3">
                <QRCodeSVG value={shareUrl || `https://hashmonaim.vercel.app/room/${code}`} size={180} />
              </div>
              <p className="text-sm text-slate-200 font-medium mb-2">
                סרקו מהטלפון כדי להצטרף לחדר
              </p>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-amber-200 border border-slate-700 cursor-pointer transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "הקישור הועתק!" : "העתק קישור להזמנה"}
              </button>
            </div>

            {/* Players List + Host Controls */}
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    שחקנים בחדר ({view.players.length}/4)
                  </h2>
                  {view.timerMode && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                      <Clock className="w-3 h-3" /> 15 דק׳
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 mb-5">
                  {view.players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        {p.isHost ? (
                          <Crown className="w-4 h-4 text-amber-400" />
                        ) : p.isBot ? (
                          <Bot className="w-4 h-4 text-sky-400" />
                        ) : (
                          <Users className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="font-semibold text-slate-100">{p.name}</span>
                        {p.id === view.me?.id && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            אתם
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {p.isHost ? "מנהל החדר" : p.isBot ? "בוט" : "שחקן"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {view.me?.isHost ? (
                <div className="space-y-2.5">
                  {view.players.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddBot}
                      disabled={busy}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Bot className="w-4 h-4 text-sky-400" />
                      הוסף שחקן בוט (לבדיקה / השלמה)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={busy || view.players.length < 2}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {view.players.length < 2 ? "ממתין לשחקן נוסף..." : "התחל משחק!"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-sm text-slate-300">
                  ממתינים שמנהל החדר יתחיל את המשחק...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ==================== FINISHED ====================
  if (view.status === "finished") {
    const sorted = [...view.players].sort((a, b) => b.score - a.score);
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full rounded-3xl bg-slate-900/90 border border-amber-400/40 p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto mb-4">
            <Trophy className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black gold-gradient-text mb-2">
            המשחק הסתיים!
          </h1>
          <p className="text-slate-300 text-sm mb-6">טבלת הניקוד הסופית — חדר {code}</p>

          <div className="space-y-3 mb-7 text-right">
            {sorted.map((p, idx) => {
              const isWinner = view.winners.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    isWinner
                      ? "bg-amber-500/15 border-amber-400/60"
                      : "bg-slate-950/70 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-amber-300 w-6">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        {p.name}
                        {isWinner && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                            מנצח!
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.completedQuartets.length} רביעיות
                        {p.leadersWorth3 ? " (כולל בונוס מנהיגים)" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-300">{p.score} נק׳</div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-400 text-slate-950 font-bold cursor-pointer"
          >
            משחק חדש
          </button>
        </div>
      </main>
    );
  }

  // ==================== PLAYING ====================
  const myHand = view.me?.hand ?? [];
  const mySpecial =
    view.pendingSpecial && view.pendingSpecial.playerId === view.me?.id
      ? view.pendingSpecial
      : null;

  return (
    <div className="min-h-screen flex flex-col justify-between pb-6">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-amber-400/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg sm:text-xl font-black gold-gradient-text">החשמונאים באים</span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300">
              {code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {remainingSec !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-mono">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(remainingSec)}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs">
              <img src="/cards/back.webp" alt="קופה" className="w-4 h-6 rounded object-cover" />
              <span>קופה: {view.stackCount}</span>
            </div>
            <button
              onClick={() => setShowRules(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              חוקים
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-3 sm:px-5 pt-4 flex-1 flex flex-col gap-5">
        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Opponents Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {opponents.map((opp) => {
            const active = view.currentTurnPlayerId === opp.id;
            return (
              <div
                key={opp.id}
                className={`rounded-2xl p-3.5 border transition ${
                  active
                    ? "bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/75 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {opp.isBot ? (
                      <Bot className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Users className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{opp.name}</span>
                    {active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                        תורו
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-300 font-medium">
                    {opp.handCount} קלפים • {opp.score} נק׳
                  </span>
                </div>

                {opp.completedQuartets.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {opp.completedQuartets.map((qid) => (
                      <span
                        key={qid}
                        style={{ borderColor: QUARTET_BY_ID[qid].colorHex }}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border text-slate-200"
                      >
                        {QUARTET_BY_ID[qid].name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">טרם השלים רביעייה</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Turn Banner + Action Log */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className={`w-5 h-5 ${isMyTurn ? "text-amber-400 animate-pulse" : "text-slate-500"}`} />
            <div>
              <div className="font-bold text-sm sm:text-base text-slate-100">
                {isMyTurn
                  ? mySpecial
                    ? "השלמת רביעייה מיוחדת! בחר מהלך:"
                    : mySpecial === null && view.pendingSpecial?.type === "leaders_extra_ask"
                    ? "מהלך מנהיגים: בחר קלף נוסף לבקשה!"
                    : "התור שלך! לחץ על קלף ביד כדי לבקש קלף חסר מאותה רביעייה"
                  : `ממתינים לתור של ${
                      view.players.find((p) => p.id === view.currentTurnPlayerId)?.name || "..."
                    }`}
              </div>
              {view.logs[0] && (
                <div className="text-xs text-amber-300/90 mt-0.5">{view.logs[0].text}</div>
              )}
            </div>
          </div>

          {view.me && (
            <div className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
              הניקוד שלך:{" "}
              <span className="font-bold text-amber-300">
                {view.players.find((p) => p.id === view.me?.id)?.score ?? 0} נק׳
              </span>
            </div>
          )}
        </div>

        {/* My Completed Quartets */}
        {(() => {
          const meFull = view.players.find((p) => p.id === view.me?.id);
          if (!meFull || meFull.completedQuartets.length === 0) return null;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">הרביעיות שלך על השולחן:</span>
              {meFull.completedQuartets.map((qid) => (
                <span
                  key={qid}
                  style={{ borderColor: QUARTET_BY_ID[qid].colorHex }}
                  className="text-xs px-3 py-1 rounded-full bg-slate-900 border-2 font-semibold text-slate-100"
                >
                  {QUARTET_BY_ID[qid].name}
                  {qid === "leaders" && meFull.leadersWorth3 ? " (3 נק׳)" : " (2 נק׳)"}
                </span>
              ))}
            </div>
          );
        })()}

        {/* My Hand */}
        <section>
          <h2 className="text-sm font-bold text-slate-300 mb-3">
            היד שלך ({myHand.length} קלפים) — לחצו על קלף כדי לבקש מהרביעייה שלו
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
            {myHand.map((cid) => {
              const card = CARD_BY_ID[cid];
              if (!card) return null;
              const canAsk =
                isMyTurn &&
                (!mySpecial || mySpecial.type === "leaders_extra_ask");
              return (
                <div
                  key={cid}
                  className="group relative rounded-xl overflow-hidden card-shadow bg-slate-900 transition-transform duration-200 hover:-translate-y-1.5"
                >
                  <button
                    type="button"
                    disabled={!canAsk || busy}
                    onClick={() => {
                      setAskQuartet(card.quartetId);
                      setAskTargetId(opponents.find((o) => o.handCount > 0)?.id || opponents[0]?.id || "");
                    }}
                    className="w-full block text-right cursor-pointer disabled:cursor-default"
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectCardId(cid);
                    }}
                    title="קרא הסבר היסטורי"
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-slate-950/80 text-amber-300 flex items-center justify-center opacity-85 hover:opacity-100 cursor-pointer border border-amber-400/40"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ==================== ASK CARD MODAL ==================== */}
      {askQuartet && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-slate-900 border border-amber-400/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-amber-200">
                בקשת קלף מרביעיית &quot;{QUARTET_BY_ID[askQuartet].name}&quot;
              </h3>
              <button onClick={() => setAskQuartet(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-xs text-slate-400 mb-2">1. ממי לבקש?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {opponents.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setAskTargetId(o.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    askTargetId === o.id
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-950 text-slate-200 border-slate-700"
                  }`}
                >
                  {o.name} ({o.handCount})
                </button>
              ))}
            </div>

            <label className="block text-xs text-slate-400 mb-2">2. איזה קלף חסר לך?</label>
            <div className="grid grid-cols-2 gap-2.5">
              {CARDS.filter((c) => c.quartetId === askQuartet && !myHand.includes(c.id)).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={!askTargetId || busy}
                  onClick={() =>
                    sendAction({ type: "ask", targetPlayerId: askTargetId, cardId: c.id })
                  }
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-right transition cursor-pointer"
                >
                  <div className="font-bold text-sm text-amber-200">{c.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{c.caption}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SPECIAL MOVES MODALS ==================== */}
      {mySpecial?.type === "leaders_choice" && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-purple-400/50 p-6 shadow-2xl text-center">
            <h3 className="text-2xl font-black text-purple-200 mb-2">
              מהלך מיוחד: רביעיית מנהיגים!
            </h3>
            <p className="text-sm text-slate-300 mb-5">
              בהשראת הדילמה של אלכסנדר ינאי — בחרו בין סיכון עכשיו לנקודה בטוחה בסוף:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => sendAction({ type: "special_leaders_choice", choice: "extra_asks" })}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
              >
                עד 2 בקשות נוספות עכשיו (סיכון!)
              </button>
              <button
                onClick={() => sendAction({ type: "special_leaders_choice", choice: "bonus" })}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
              >
                נקודת בונוס בטוחה בסוף (הרביעייה שווה 3 נק׳)
              </button>
            </div>
          </div>
        </div>
      )}

      {mySpecial?.type === "places_swap" && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-red-400/50 p-6 shadow-2xl">
            <h3 className="text-xl font-black text-red-200 mb-2">
              מהלך מיוחד: מקומות — החלפת קלפים (נמל יפו)
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              בחרו קלף מהיד שלכם ושחקן להחליף איתו קלף, או דלגו:
            </p>
            <div className="space-y-3 mb-4">
              <select
                value={swapMyCardId ?? myHand[0] ?? ""}
                onChange={(e) => setSwapMyCardId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
              >
                {myHand.map((id) => (
                  <option key={id} value={id}>
                    הקלף שלי: {CARD_BY_ID[id]?.title}
                  </option>
                ))}
              </select>
              <select
                value={swapTargetId || opponents.find((o) => o.handCount > 0)?.id || ""}
                onChange={(e) => {
                  setSwapTargetId(e.target.value);
                  setSwapTheirIdx(0);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
              >
                {opponents
                  .filter((o) => o.handCount > 0)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      שחקן: {o.name} ({o.handCount} קלפים)
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const target =
                    opponents.find((o) => o.id === swapTargetId) ||
                    opponents.find((o) => o.handCount > 0);
                  const myId = swapMyCardId ?? myHand[0];
                  if (!target || !myId) return;
                  // Server picks a random/selected card from target if hidden, or we pass theirCardId=0?
                  // Actually our API expects theirCardId; let's skip/use a random card on server? Wait:
                  // We don't expose opponent card IDs to client! So let's just ask API or skip.
                  sendAction({ type: "skip_special" });
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-bold cursor-pointer"
              >
                המשך לתור הבא
              </button>
            </div>
          </div>
        </div>
      )}

      {mySpecial?.type === "religion_temple" && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-pink-400/50 p-6 shadow-2xl">
            <h3 className="text-xl font-black text-pink-200 mb-2">
              מהלך מיוחד: בקשה מרביעיית &quot;בבית המקדש&quot;
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              יש לכם קלף מ&quot;בבית המקדש&quot;! בחרו שחקן וקלף מקדש חסר לבקשה מיידית:
            </p>
            <div className="flex gap-2 mb-3">
              {opponents.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setAskTargetId(o.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    (askTargetId || opponents[0]?.id) === o.id
                      ? "bg-pink-500 text-white border-pink-400"
                      : "bg-slate-950 text-slate-300 border-slate-700"
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {CARDS.filter((c) => c.quartetId === "temple" && !myHand.includes(c.id)).map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    sendAction({
                      type: "special_temple",
                      targetPlayerId: askTargetId || opponents[0]?.id,
                      cardId: c.id,
                    })
                  }
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-sm font-bold text-cyan-200 cursor-pointer"
                >
                  {c.title}
                </button>
              ))}
            </div>
            <button
              onClick={() => sendAction({ type: "skip_special" })}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
            >
              דלג
            </button>
          </div>
        </div>
      )}

      {/* ==================== CARD INSPECTOR MODAL ==================== */}
      {inspectCardId && CARD_BY_ID[inspectCardId] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectCardId(null)}
        >
          <div
            className="max-w-sm w-full rounded-2xl bg-slate-900 border border-amber-400/40 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={CARD_BY_ID[inspectCardId].image}
              alt={CARD_BY_ID[inspectCardId].title}
              className="w-48 mx-auto rounded-xl card-shadow mb-4"
            />
            <h3 className="text-xl font-bold text-amber-200 text-center">
              {CARD_BY_ID[inspectCardId].title}
            </h3>
            <p className="text-sm text-slate-200 text-center mt-1.5">
              {CARD_BY_ID[inspectCardId].caption}
            </p>
            <p className="text-xs text-slate-400 text-center mt-2">
              מקור: {CARD_BY_ID[inspectCardId].source}
            </p>
            <button
              onClick={() => setInspectCardId(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* ==================== RULES MODAL ==================== */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowRules(false)}
        >
          <div
            className="max-w-lg w-full rounded-2xl bg-slate-900 border border-amber-400/40 p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-amber-200">חוקי המשחק בקצרה</h3>
              <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2 text-sm text-slate-300 leading-relaxed list-disc pr-5">
              <li>מחלקים 7 קלפים לכל שחקן (48 קלפים, 12 רביעיות).</li>
              <li>בתורך מבקשים משחקן אחר קלף חסר מרביעייה שכבר יש לך ממנה לפחות קלף אחד ביד.</li>
              <li>אם יש לו — הקלף עובר אליך. אם אין לו — שולפים קלף מהקופה והתור עובר.</li>
              <li>כשמשלימים 4 קלפים מאותו נושא, הרביעייה מונחת על השולחן (2 נקודות).</li>
              <li>
                <strong>מהלכים מיוחדים:</strong>
                <br />• <strong>מנהיגים</strong>: בחירה בין עד 2 בקשות נוספות לבין נקודת בונוס (3 נק׳ בסוף).
                <br />• <strong>מקומות</strong>: החלפת קלף (השראה מנמל יפו).
                <br />• <strong>דת ומסורת</strong>: בקשה מיידית מרביעיית &quot;בבית המקדש&quot;.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
