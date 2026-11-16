import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function broadcastRoomTick(code: string, version: number) {
  if (!supabase) return;
  try {
    const channel = supabase.channel(`room:${code}`);
    await channel.send({
      type: "broadcast",
      event: "tick",
      payload: { version },
    });
    await supabase.removeChannel(channel);
  } catch {
    // Polling fallback handles sync if broadcast fails
  }
}
