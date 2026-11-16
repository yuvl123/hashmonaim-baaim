import { put, get } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import type { RoomState } from "./game-engine";

const LOCAL_DIR = path.join(process.cwd(), ".data", "rooms");

export async function saveRoom(room: RoomState): Promise<void> {
  const key = `rooms/${room.code}.json`;
  const payload = JSON.stringify(room);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(key, payload, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, `${room.code}.json`), payload, "utf8");
}

export async function loadRoom(code: string): Promise<RoomState | null> {
  const normalized = code.trim().toUpperCase();
  const key = `rooms/${normalized}.json`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const res = await get(key, { access: "private", useCache: false });
      if (!res || res.statusCode !== 200 || !res.stream) return null;
      const text = await new Response(res.stream).text();
      return JSON.parse(text) as RoomState;
    } catch {
      return null;
    }
  }

  try {
    const text = await fs.readFile(path.join(LOCAL_DIR, `${normalized}.json`), "utf8");
    return JSON.parse(text) as RoomState;
  } catch {
    return null;
  }
}
