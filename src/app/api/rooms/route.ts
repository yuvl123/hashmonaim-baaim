import { NextResponse } from "next/server";
import { createRoom, buildPlayerView } from "@/lib/game-engine";
import { saveRoom } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const hostName = typeof body?.hostName === "string" ? body.hostName : "מארח";
    const timerMode = Boolean(body?.timerMode);
    const { room, hostToken } = createRoom(hostName, timerMode);
    await saveRoom(room);
    return NextResponse.json({
      code: room.code,
      token: hostToken,
      view: buildPlayerView(room, hostToken),
    });
  } catch (err) {
    console.error("Create room error:", err);
    return NextResponse.json({ error: "שגיאה ביצירת החדר" }, { status: 500 });
  }
}
