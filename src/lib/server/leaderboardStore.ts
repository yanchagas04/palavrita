import { supabase } from "@/lib/server/supabase";

export interface LeaderboardUser {
  id: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
}

export interface LeaderboardEntry {
  id: string;
  user: LeaderboardUser;
  dateString: string;
  guesses: string[];
  gameStatus: "WON" | "LOST";
  attempts: number;
  completedAt: string;
  guildId?: string;
  channelId?: string;
}

interface RawLeaderboardRow {
  id: string;
  user_id: string;
  username: string;
  global_name: string | null;
  avatar_url: string | null;
  date_string: string;
  guesses: string[];
  game_status: "WON" | "LOST";
  attempts: number;
  completed_at: string;
  guild_id: string;
  channel_id: string | null;
}

function makeEntryKey(dateString: string, guildId: string, userId: string): string {
  return `${dateString}__${guildId}__${userId}`;
}

function mapRowToEntry(row: RawLeaderboardRow): LeaderboardEntry {
  return {
    id: row.id,
    user: {
      id: row.user_id,
      username: row.username,
      globalName: row.global_name || undefined,
      avatarUrl: row.avatar_url || undefined,
    },
    dateString: row.date_string,
    guesses: row.guesses || [],
    gameStatus: row.game_status,
    attempts: row.attempts,
    completedAt: row.completed_at,
    guildId: row.guild_id,
    channelId: row.channel_id || undefined,
  };
}

function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.sort((a, b) => {
    if (a.gameStatus === "WON" && b.gameStatus !== "WON") return -1;
    if (a.gameStatus !== "WON" && b.gameStatus === "WON") return 1;
    if (a.gameStatus === "WON" && b.gameStatus === "WON") {
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    }
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
}

export async function isNotificationPosted(dateString: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("posted_notifications")
      .select("date_string")
      .eq("date_string", dateString)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar notificação enviada no Supabase:", error);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error("Erro ao conectar no Supabase (isNotificationPosted):", err);
    return false;
  }
}

export async function markNotificationPosted(dateString: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("posted_notifications")
      .upsert({ date_string: dateString }, { onConflict: "date_string" });

    if (error) {
      console.error("Erro ao marcar notificação enviada no Supabase:", error);
    }
  } catch (err) {
    console.error("Erro ao conectar no Supabase (markNotificationPosted):", err);
  }
}

export async function getTodayLeaderboard(
  todayDateStr: string,
  guildId: string = "global"
): Promise<LeaderboardEntry[]> {
  const targetGuild = guildId || "global";

  try {
    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select("*")
      .eq("date_string", todayDateStr)
      .eq("guild_id", targetGuild);

    if (error) {
      console.error("Erro ao buscar leaderboard no Supabase:", error);
      return [];
    }

    const entries = (data as RawLeaderboardRow[]).map(mapRowToEntry);
    return sortLeaderboard(entries);
  } catch (err) {
    console.error("Erro de conexão com Supabase (getTodayLeaderboard):", err);
    return [];
  }
}

export async function addOrUpdateLeaderboardEntry(
  entryData: Omit<LeaderboardEntry, "id" | "completedAt">
): Promise<LeaderboardEntry[]> {
  const targetGuild = entryData.guildId || "global";
  const key = makeEntryKey(entryData.dateString, targetGuild, entryData.user.id);
  const nowStr = new Date().toISOString();

  const rowToInsert = {
    id: key,
    user_id: entryData.user.id,
    username: entryData.user.username,
    global_name: entryData.user.globalName || null,
    avatar_url: entryData.user.avatarUrl || null,
    date_string: entryData.dateString,
    guesses: entryData.guesses,
    game_status: entryData.gameStatus,
    attempts: entryData.guesses.length,
    guild_id: targetGuild,
    channel_id: entryData.channelId || null,
    completed_at: nowStr,
  };

  try {
    const { error } = await supabase
      .from("leaderboard_entries")
      .upsert(rowToInsert, { onConflict: "id" });

    if (error) {
      console.error("Erro ao salvar entrada do leaderboard no Supabase:", error);
    }
  } catch (err) {
    console.error("Erro de conexão com Supabase (addOrUpdateLeaderboardEntry):", err);
  }

  return getTodayLeaderboard(entryData.dateString, targetGuild);
}

export async function getAllLeaderboardsForDate(
  todayDateStr: string
): Promise<Record<string, LeaderboardEntry[]>> {
  try {
    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select("*")
      .eq("date_string", todayDateStr);

    if (error) {
      console.error("Erro ao buscar todos os leaderboards no Supabase:", error);
      return {};
    }

    const grouped: Record<string, LeaderboardEntry[]> = {};
    const entries = (data as RawLeaderboardRow[]).map(mapRowToEntry);

    for (const entry of entries) {
      const gId = entry.guildId || "global";
      if (!grouped[gId]) grouped[gId] = [];
      grouped[gId].push(entry);
    }

    for (const gId in grouped) {
      grouped[gId] = sortLeaderboard(grouped[gId]);
    }

    return grouped;
  } catch (err) {
    console.error("Erro de conexão com Supabase (getAllLeaderboardsForDate):", err);
    return {};
  }
}
