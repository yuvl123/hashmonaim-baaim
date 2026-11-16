import { NextResponse } from "next/server";
import { performAction, buildPlayerView } from "@/lib/game-engine";
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
    const action = body?.action;
    if (!action || typeof action !== "object") {
      return NextResponse.json({ error: "פעולה לא תקינה." }, { status: 400 });
    }

    const res = performAction(room, token, action);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

    await saveRoom(room);
    await broadcastRoomTick(room.code, room.version);
    return NextResponse.json({ view: buildPlayerView(room, token) });
  } catch (err) {
    console.error("Action error:", err);
    return NextResponse.json({ error: "שגיאה בביצוע הפעולה" }, { status: 500 });
  }
}
