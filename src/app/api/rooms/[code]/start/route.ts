import { NextResponse } from "next/server";
import { startGame, buildPlayerView } from "@/lib/game-engine";
import { loadRoom, saveRoom } from "@/lib/storage";
import { broadcastRoomTick } from "@/lib/supabase-client";

export async function POST(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const room = await loadRoom(code);
    if (!room) return NextResponse.json({ error: "החדר לא נמצא." }, { status: 404 });

    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const timerMode = typeof body?.timerMode === "boolean" ? body.timerMode : undefined;

    const res = startGame(room, token, timerMode);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

    await saveRoom(room);
    await broadcastRoomTick(room.code, room.version);
    return NextResponse.json({ view: buildPlayerView(room, token) });
  } catch (err) {
    console.error("Start game error:", err);
    return NextResponse.json({ error: "שגיאה בהתחלת המשחק" }, { status: 500 });
  }
}
