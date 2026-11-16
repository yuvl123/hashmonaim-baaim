import { NextResponse } from "next/server";
import { buildPlayerView } from "@/lib/game-engine";
import { loadRoom } from "@/lib/storage";

export async function GET(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const room = await loadRoom(code);
    if (!room) return NextResponse.json({ error: "החדר לא נמצא." }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    return NextResponse.json({ view: buildPlayerView(room, token) });
  } catch (err) {
    console.error("Get state error:", err);
    return NextResponse.json({ error: "שגיאה בטעינת מצב המשחק" }, { status: 500 });
  }
}
