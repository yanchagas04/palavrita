// Leaderboard armazenado em memória do servidor (in-memory)
// Funciona localmente e na Vercel. Para persistência entre restarts, use banco de dados (ex: Supabase).

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

// Armazenamento em memória — persiste enquanto a instância do servidor estiver viva
const entriesStore: Map<string, LeaderboardEntry> = new Map();
const notificationsPosted: Set<string> = new Set();

function makeEntryKey(dateString: string, guildId: string, userId: string): string {
  return `${dateString}__${guildId}__${userId}`;
}

export function isNotificationPosted(dateString: string): boolean {
  return notificationsPosted.has(dateString);
}

export function markNotificationPosted(dateString: string): void {
  notificationsPosted.add(dateString);
}

export function getTodayLeaderboard(todayDateStr: string, guildId: string = "global"): LeaderboardEntry[] {
  const targetGuild = guildId || "global";

  const filtered: LeaderboardEntry[] = [];
  for (const entry of entriesStore.values()) {
    const entryGuild = entry.guildId || "global";
    if (entry.dateString === todayDateStr && entryGuild === targetGuild) {
      filtered.push(entry);
    }
  }

  return filtered.sort((a, b) => {
    if (a.gameStatus === "WON" && b.gameStatus !== "WON") return -1;
    if (a.gameStatus !== "WON" && b.gameStatus === "WON") return 1;
    if (a.gameStatus === "WON" && b.gameStatus === "WON") {
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    }
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
}

export function addOrUpdateLeaderboardEntry(
  entryData: Omit<LeaderboardEntry, "id" | "completedAt">
): LeaderboardEntry[] {
  const targetGuild = entryData.guildId || "global";
  const key = makeEntryKey(entryData.dateString, targetGuild, entryData.user.id);

  const newEntry: LeaderboardEntry = {
    ...entryData,
    guildId: targetGuild,
    id: key,
    completedAt: new Date().toISOString(),
  };

  entriesStore.set(key, newEntry);

  return getTodayLeaderboard(entryData.dateString, targetGuild);
}

export function getAllLeaderboardsForDate(todayDateStr: string): Record<string, LeaderboardEntry[]> {
  const grouped: Record<string, LeaderboardEntry[]> = {};

  for (const entry of entriesStore.values()) {
    if (entry.dateString !== todayDateStr) continue;
    const gId = entry.guildId || "global";
    if (!grouped[gId]) grouped[gId] = [];
    grouped[gId].push(entry);
  }

  return grouped;
}
