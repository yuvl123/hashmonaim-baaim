import crypto from "crypto";
import { CARDS, CARD_BY_ID, QUARTET_BY_ID, type QuartetId } from "@/data/cards";

export type RoomStatus = "lobby" | "playing" | "finished";

export type PendingSpecial =
  | {
      type: "places_swap";
      playerId: string;
    }
  | {
      type: "religion_temple";
      playerId: string;
    }
  | {
      type: "leaders_choice";
      playerId: string;
    }
  | {
      type: "leaders_extra_ask";
      playerId: string;
      remainingAsks: number;
    };

export interface PlayerInternal {
  id: string;
  token: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  hand: number[];
  completedQuartets: QuartetId[];
  leadersWorth3: boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  highlight?: boolean;
  ts: number;
}

export interface RoomState {
  code: string;
  version: number;
  status: RoomStatus;
  timerMode: boolean;
  startedAt: number | null;
  timerDurationSec: number;
  finishingRound: boolean;
  startingPlayerIndex: number;
  currentTurnIndex: number;
  players: PlayerInternal[];
  stack: number[];
  pendingSpecial: PendingSpecial | null;
  lastCompletedCardId: number | null;
  logs: LogEntry[];
  createdAt: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  handCount: number;
  completedQuartets: QuartetId[];
  leadersWorth3: boolean;
  score: number;
}

export interface PlayerView {
  code: string;
  version: number;
  status: RoomStatus;
  timerMode: boolean;
  startedAt: number | null;
  timerDurationSec: number;
  finishingRound: boolean;
  currentTurnPlayerId: string | null;
  me: {
    id: string;
    name: string;
    isHost: boolean;
    hand: number[];
  } | null;
  players: PublicPlayer[];
  stackCount: number;
  pendingSpecial: PendingSpecial | null;
  lastCompletedCardId: number | null;
  logs: LogEntry[];
  winners: string[];
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function addLog(room: RoomState, text: string, highlight = false) {
  room.logs.unshift({
    id: crypto.randomBytes(4).toString("hex"),
    text,
    highlight,
    ts: Date.now(),
  });
  if (room.logs.length > 30) room.logs = room.logs.slice(0, 30);
}

export function calcScore(p: PlayerInternal): number {
  let score = p.completedQuartets.length * 2;
  if (p.completedQuartets.includes("leaders") && p.leadersWorth3) {
    score += 1;
  }
  return score;
}

function totalCompletedQuartets(room: RoomState): number {
  return room.players.reduce((sum, p) => sum + p.completedQuartets.length, 0);
}

function checkAndLayQuartets(
  room: RoomState,
  player: PlayerInternal,
  allowSpecial: boolean
): QuartetId | null {
  let triggeredSpecial: QuartetId | null = null;
  const byQuartet = new Map<QuartetId, number[]>();

  for (const cid of player.hand) {
    const c = CARD_BY_ID[cid];
    if (!c) continue;
    const list = byQuartet.get(c.quartetId) ?? [];
    list.push(cid);
    byQuartet.set(c.quartetId, list);
  }

  for (const [qid, cids] of byQuartet.entries()) {
    if (cids.length === 4) {
      player.hand = player.hand.filter((id) => !cids.includes(id));
      player.completedQuartets.push(qid);
      const qName = QUARTET_BY_ID[qid].name;
      addLog(room, `${player.name} השלים את רביעיית "${qName}"!`, true);
      room.lastCompletedCardId = cids[0];
      if (
        allowSpecial &&
        !triggeredSpecial &&
        (qid === "places" || qid === "religion" || qid === "leaders")
      ) {
        triggeredSpecial = qid;
      }
    }
  }
  return triggeredSpecial;
}

function checkTimerAndEnd(room: RoomState, nextTurnIdx: number): boolean {
  if (totalCompletedQuartets(room) >= 12) {
    room.status = "finished";
    addLog(room, "כל 12 הרביעיות הושלמו — המשחק הסתיים!", true);
    return true;
  }

  if (room.timerMode && room.startedAt) {
    const elapsedSec = (Date.now() - room.startedAt) / 1000;
    if (elapsedSec >= room.timerDurationSec) {
      room.finishingRound = true;
    }
    if (room.finishingRound && nextTurnIdx === room.startingPlayerIndex) {
      room.status = "finished";
      addLog(room, "הסתיים הזמן והסבב הושלם — המשחק הסתיים!", true);
      return true;
    }
  }
  return false;
}

function advanceTurn(room: RoomState) {
  room.pendingSpecial = null;
  const nextIdx = (room.currentTurnIndex + 1) % room.players.length;
  if (checkTimerAndEnd(room, nextIdx)) return;

  room.currentTurnIndex = nextIdx;
  const nextPlayer = room.players[room.currentTurnIndex];

  // If player starts turn with empty hand
  if (nextPlayer.hand.length === 0) {
    if (room.stack.length > 0) {
      const drawn = room.stack.pop()!;
      nextPlayer.hand.push(drawn);
      addLog(room, `${nextPlayer.name} התחיל עם יד ריקה ושלף קלף מהקופה.`);
      checkAndLayQuartets(room, nextPlayer, false);
    } else {
      addLog(room, `${nextPlayer.name} בלי קלפים והקופה ריקה — מדלג על התור.`);
    }
    // Check if everyone is empty & stack empty -> finish
    if (
      room.stack.length === 0 &&
      room.players.every((p) => p.hand.length === 0)
    ) {
      room.status = "finished";
      return;
    }
    advanceTurn(room);
  }
}

export function createRoom(hostName: string, timerMode: boolean): {
  room: RoomState;
  hostToken: string;
} {
  const code = generateRoomCode();
  const hostToken = generateToken();
  const room: RoomState = {
    code,
    version: 1,
    status: "lobby",
    timerMode,
    startedAt: null,
    timerDurationSec: 15 * 60,
    finishingRound: false,
    startingPlayerIndex: 0,
    currentTurnIndex: 0,
    players: [
      {
        id: crypto.randomBytes(6).toString("hex"),
        token: hostToken,
        name: hostName.trim() || "מארח",
        isHost: true,
        isBot: false,
        hand: [],
        completedQuartets: [],
        leadersWorth3: false,
      },
    ],
    stack: [],
    pendingSpecial: null,
    lastCompletedCardId: null,
    logs: [{ id: "init", text: `${hostName.trim() || "המארח"} פתח את החדר.`, ts: Date.now() }],
    createdAt: Date.now(),
  };
  return { room, hostToken };
}

export function joinRoom(room: RoomState, playerName: string): {
  ok: boolean;
  error?: string;
  playerToken?: string;
} {
  if (room.status !== "lobby") {
    return { ok: false, error: "המשחק כבר התחיל בחדר הזה." };
  }
  if (room.players.length >= 4) {
    return { ok: false, error: "החדר מלא (מקסימום 4 שחקנים)." };
  }
  const cleanName = playerName.trim();
  if (!cleanName) {
    return { ok: false, error: "יש להזין שם שחקן." };
  }
  const token = generateToken();
  room.players.push({
    id: crypto.randomBytes(6).toString("hex"),
    token,
    name: cleanName,
    isHost: false,
    isBot: false,
    hand: [],
    completedQuartets: [],
    leadersWorth3: false,
  });
  room.version += 1;
  addLog(room, `${cleanName} הצטרף לחדר!`);
  return { ok: true, playerToken: token };
}

export function addBot(room: RoomState, hostToken: string): {
  ok: boolean;
  error?: string;
} {
  const host = room.players.find((p) => p.token === hostToken);
  if (!host || !host.isHost) return { ok: false, error: "רק מנהל החדר יכול להוסיף בוט." };
  if (room.status !== "lobby") return { ok: false, error: "לא ניתן להוסיף בוט אחרי שהמשחק התחיל." };
  if (room.players.length >= 4) return { ok: false, error: "החדר כבר מלא (4 שחקנים)." };

  const botNames = ["בוט יהודה", "בוט שמעון", "בוט שלומציון", "בוט יונתן"];
  const used = new Set(room.players.map((p) => p.name));
  const name = botNames.find((n) => !used.has(n)) ?? `בוט ${room.players.length + 1}`;

  room.players.push({
    id: crypto.randomBytes(6).toString("hex"),
    token: `bot_${generateToken()}`,
    name,
    isHost: false,
    isBot: true,
    hand: [],
    completedQuartets: [],
    leadersWorth3: false,
  });
  room.version += 1;
  addLog(room, `${name} נוסף לחדר.`);
  return { ok: true };
}

export function startGame(room: RoomState, hostToken: string, timerMode?: boolean): {
  ok: boolean;
  error?: string;
} {
  const host = room.players.find((p) => p.token === hostToken);
  if (!host || !host.isHost) return { ok: false, error: "רק מנהל החדר יכול להתחיל את המשחק." };
  if (room.players.length < 2) return { ok: false, error: "נדרשים לפחות 2 שחקנים כדי להתחיל." };

  if (typeof timerMode === "boolean") {
    room.timerMode = timerMode;
  }

  const deck = shuffle(CARDS.map((c) => c.id));
  for (const p of room.players) {
    p.hand = deck.splice(0, 7);
    p.completedQuartets = [];
    p.leadersWorth3 = false;
  }

  room.stack = deck;
  room.status = "playing";
  room.startedAt = Date.now();
  room.finishingRound = false;
  room.startingPlayerIndex = Math.floor(Math.random() * room.players.length);
  room.currentTurnIndex = room.startingPlayerIndex;
  room.pendingSpecial = null;
  room.lastCompletedCardId = null;
  room.logs = [];
  addLog(room, `המשחק התחיל! ${room.players[room.currentTurnIndex].name} מתחיל.`, true);

  for (const p of room.players) {
    checkAndLayQuartets(room, p, false);
  }

  room.version += 1;
  advanceBotsIfNeeded(room);
  return { ok: true };
}

function triggerSpecialIfApplicable(
  room: RoomState,
  player: PlayerInternal,
  special: QuartetId | null
): boolean {
  if (!special) return false;
  if (special === "places") {
    const hasCard = player.hand.length > 0;
    const oppHasCard = room.players.some((p) => p.id !== player.id && p.hand.length > 0);
    if (hasCard && oppHasCard) {
      room.pendingSpecial = { type: "places_swap", playerId: player.id };
      return true;
    }
  } else if (special === "religion") {
    const hasTemple = player.hand.some((id) => CARD_BY_ID[id]?.quartetId === "temple");
    if (hasTemple) {
      room.pendingSpecial = { type: "religion_temple", playerId: player.id };
      return true;
    }
  } else if (special === "leaders") {
    room.pendingSpecial = { type: "leaders_choice", playerId: player.id };
    return true;
  }
  return false;
}

export function performAction(
  room: RoomState,
  playerToken: string,
  payload:
    | { type: "ask"; targetPlayerId: string; cardId: number }
    | { type: "special_swap"; targetPlayerId: string; myCardId: number; theirCardId: number }
    | { type: "special_temple"; targetPlayerId: string; cardId: number }
    | { type: "special_leaders_choice"; choice: "bonus" | "extra_asks" }
    | { type: "skip_special" }
): { ok: boolean; error?: string } {
  if (room.status !== "playing") return { ok: false, error: "המשחק אינו פעיל." };
  const current = room.players[room.currentTurnIndex];
  if (!current || current.token !== playerToken) {
    return { ok: false, error: "זה לא התור שלך." };
  }

  if (payload.type === "skip_special") {
    if (!room.pendingSpecial || room.pendingSpecial.playerId !== current.id) {
      return { ok: false, error: "אין מהלך מיוחד פעיל." };
    }
    addLog(room, `${current.name} ויתר על המהלך המיוחד.`);
    advanceTurn(room);
    room.version += 1;
    advanceBotsIfNeeded(room);
    return { ok: true };
  }

  if (payload.type === "special_leaders_choice") {
    if (room.pendingSpecial?.type !== "leaders_choice") {
      return { ok: false, error: "אין בחירת מנהיגים פעילה." };
    }
    if (payload.choice === "bonus") {
      current.leadersWorth3 = true;
      addLog(room, `${current.name} בחר בנקודת בונוס (רביעיית המנהיגים שווה 3 נקודות).`, true);
      advanceTurn(room);
    } else {
      room.pendingSpecial = {
        type: "leaders_extra_ask",
        playerId: current.id,
        remainingAsks: 2,
      };
      addLog(room, `${current.name} בחר בבקשות נוספות!`, true);
    }
    room.version += 1;
    advanceBotsIfNeeded(room);
    return { ok: true };
  }

  if (payload.type === "special_swap") {
    if (room.pendingSpecial?.type !== "places_swap") {
      return { ok: false, error: "אין החלפת קלפים פעילה." };
    }
    const target = room.players.find((p) => p.id === payload.targetPlayerId && p.id !== current.id);
    if (!target) return { ok: false, error: "שחקן יעד לא תקין." };
    if (!current.hand.includes(payload.myCardId) || !target.hand.includes(payload.theirCardId)) {
      return { ok: false, error: "אחד הקלפים אינו נמצא ביד." };
    }
    current.hand = current.hand.filter((id) => id !== payload.myCardId);
    target.hand = target.hand.filter((id) => id !== payload.theirCardId);
    current.hand.push(payload.theirCardId);
    target.hand.push(payload.myCardId);
    addLog(room, `${current.name} החליף קלף עם ${target.name} (מהלך נמל יפו).`, true);
    checkAndLayQuartets(room, current, false);
    checkAndLayQuartets(room, target, false);
    advanceTurn(room);
    room.version += 1;
    advanceBotsIfNeeded(room);
    return { ok: true };
  }

  if (payload.type === "special_temple") {
    if (room.pendingSpecial?.type !== "religion_temple") {
      return { ok: false, error: "אין מהלך מקדש פעיל." };
    }
    const card = CARD_BY_ID[payload.cardId];
    if (!card || card.quartetId !== "temple") {
      return { ok: false, error: "יש לבחור קלף מרביעיית \"בבית המקדש\"." };
    }
    const target = room.players.find((p) => p.id === payload.targetPlayerId && p.id !== current.id);
    if (!target) return { ok: false, error: "שחקן יעד לא תקין." };
    if (target.hand.includes(payload.cardId)) {
      target.hand = target.hand.filter((id) => id !== payload.cardId);
      current.hand.push(payload.cardId);
      addLog(room, `${current.name} קיבל מ${target.name} את "${card.title}" (מהלך המקדש)!`, true);
      checkAndLayQuartets(room, current, false);
    } else {
      addLog(room, `${current.name} ביקש מ${target.name} את "${card.title}" (מהלך המקדש) — ואין לו.`);
    }
    advanceTurn(room);
    room.version += 1;
    advanceBotsIfNeeded(room);
    return { ok: true };
  }

  // Regular ask OR leaders extra ask
  const isExtraAsk = room.pendingSpecial?.type === "leaders_extra_ask";
  if (room.pendingSpecial && !isExtraAsk) {
    return { ok: false, error: "יש להשלים קודם את המהלך המיוחד." };
  }

  const card = CARD_BY_ID[payload.cardId];
  if (!card) return { ok: false, error: "קלף לא תקין." };
  const target = room.players.find((p) => p.id === payload.targetPlayerId && p.id !== current.id);
  if (!target) return { ok: false, error: "שחקן יעד לא תקין." };

  const hasQuartetCard = current.hand.some((id) => CARD_BY_ID[id]?.quartetId === card.quartetId);
  if (!hasQuartetCard) {
    return { ok: false, error: "מותר לבקש רק מרביעייה שכבר יש לך ממנה קלף ביד." };
  }
  if (current.hand.includes(payload.cardId)) {
    return { ok: false, error: "הקלף הזה כבר נמצא אצלך ביד." };
  }

  if (target.hand.includes(payload.cardId)) {
    target.hand = target.hand.filter((id) => id !== payload.cardId);
    current.hand.push(payload.cardId);
    addLog(room, `${current.name} ביקש מ${target.name} את "${card.title}" — וקיבל!`, true);

    const special = checkAndLayQuartets(room, current, !isExtraAsk);
    if (totalCompletedQuartets(room) >= 12) {
      room.status = "finished";
      addLog(room, "כל 12 הרביעיות הושלמו — המשחק הסתיים!", true);
    } else if (isExtraAsk && room.pendingSpecial?.type === "leaders_extra_ask") {
      if (room.pendingSpecial.remainingAsks > 1 && current.hand.length > 0) {
        room.pendingSpecial.remainingAsks -= 1;
      } else {
        advanceTurn(room);
      }
    } else if (!triggerSpecialIfApplicable(room, current, special)) {
      advanceTurn(room);
    }
  } else {
    addLog(room, `${current.name} ביקש מ${target.name} את "${card.title}" — ואין לו.`);
    if (!isExtraAsk && room.stack.length > 0) {
      const drawn = room.stack.pop()!;
      current.hand.push(drawn);
      addLog(room, `${current.name} שלף קלף מהקופה.`);
      checkAndLayQuartets(room, current, false);
    }
    advanceTurn(room);
  }

  room.version += 1;
  advanceBotsIfNeeded(room);
  return { ok: true };
}

function advanceBotsIfNeeded(room: RoomState) {
  let guard = 0;
  while (room.status === "playing" && guard < 24) {
    guard++;
    const current = room.players[room.currentTurnIndex];
    if (!current || !current.isBot) break;

    if (room.pendingSpecial) {
      if (room.pendingSpecial.type === "leaders_choice") {
        performAction(room, current.token, {
          type: "special_leaders_choice",
          choice: "bonus",
        });
      } else {
        performAction(room, current.token, { type: "skip_special" });
      }
      continue;
    }

    if (current.hand.length === 0) {
      advanceTurn(room);
      continue;
    }

    // Pick a random quartet the bot holds and ask for a missing card
    const heldCard = CARD_BY_ID[current.hand[Math.floor(Math.random() * current.hand.length)]];
    const missing = CARDS.filter(
      (c) => c.quartetId === heldCard.quartetId && !current.hand.includes(c.id)
    );
    const opponents = room.players.filter((p) => p.id !== current.id && p.hand.length > 0);
    const target = opponents[Math.floor(Math.random() * opponents.length)] ??
      room.players.find((p) => p.id !== current.id)!;

    if (missing.length > 0 && target) {
      const askCard = missing[Math.floor(Math.random() * missing.length)];
      performAction(room, current.token, {
        type: "ask",
        targetPlayerId: target.id,
        cardId: askCard.id,
      });
    } else {
      advanceTurn(room);
    }
  }
}

export function buildPlayerView(room: RoomState, token: string | null): PlayerView {
  const me = token ? room.players.find((p) => p.token === token) ?? null : null;
  const maxScore = room.players.reduce((m, p) => Math.max(m, calcScore(p)), 0);
  const winners =
    room.status === "finished"
      ? room.players.filter((p) => calcScore(p) === maxScore).map((p) => p.id)
      : [];

  return {
    code: room.code,
    version: room.version,
    status: room.status,
    timerMode: room.timerMode,
    startedAt: room.startedAt,
    timerDurationSec: room.timerDurationSec,
    finishingRound: room.finishingRound,
    currentTurnPlayerId:
      room.status === "playing" ? room.players[room.currentTurnIndex]?.id ?? null : null,
    me: me
      ? {
          id: me.id,
          name: me.name,
          isHost: me.isHost,
          hand: [...me.hand].sort((a, b) => a - b),
        }
      : null,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isBot: p.isBot,
      handCount: p.hand.length,
      completedQuartets: p.completedQuartets,
      leadersWorth3: p.leadersWorth3,
      score: calcScore(p),
    })),
    stackCount: room.stack.length,
    pendingSpecial: room.pendingSpecial,
    lastCompletedCardId: room.lastCompletedCardId,
    logs: room.logs,
    winners,
  };
}
