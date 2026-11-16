import { NextResponse } from "next/server";
import { joinRoom, buildPlayerView } from "@/lib/game-engine";
import { loadRoom, saveRoom } from "@/lib/storage";
import { broadcastRoomTick } from "@/lib/supabase-client";

export async function POST(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const room = await loadRoom(code);
    if (!room) {
      return NextResponse.json({ error: "החדר לא נמצא." }, { status: 404 });
    }
    const body = await req.json();
    const playerName = typeof body?.playerName === "string" ? body.playerName : "";
    const res = joinRoom(room, playerName);
    if (!res.ok || !res.playerToken) {
      return NextResponse.json({ error: res.error || "שגיאה בהצטרפות" }, { status: 400 });
    }
    await saveRoom(room);
    await broadcastRoomTick(room.code, room.version);
    return NextResponse.json({
      code: room.code,
      token: res.playerToken,
      view: buildPlayerView(room, res.playerToken),
    });
  } catch (err) {
    console.error("Join room error:", err);
    return NextResponse.json({ error: "שגיאה בהצטרפות לחדר" }, { status: 500 });
  }
}
