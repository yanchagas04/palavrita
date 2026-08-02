import fs from "fs";
import path from "path";

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

interface LeaderboardDataFile {
  entries: LeaderboardEntry[];
  postedNotifications?: Record<string, boolean>; // Ex: { "2026-08-01": true }
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "leaderboard.json");

function ensureFileExists(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(
        FILE_PATH,
        JSON.stringify({ entries: [], postedNotifications: {} }, null, 2),
        "utf-8"
      );
    }
  } catch (e) {
    console.error("Erro ao criar estrutura de armazenamento do leaderboard:", e);
  }
}

function readData(): LeaderboardDataFile {
  try {
    ensureFileExists();
    const content = fs.readFileSync(FILE_PATH, "utf-8");
    const parsed = JSON.parse(content);
    return {
      entries: parsed.entries || [],
      postedNotifications: parsed.postedNotifications || {},
    };
  } catch (e) {
    console.error("Erro ao ler leaderboard:", e);
    return { entries: [], postedNotifications: {} };
  }
}

function writeData(data: LeaderboardDataFile): void {
  try {
    ensureFileExists();
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Erro ao salvar leaderboard:", e);
  }
}

export function isNotificationPosted(dateString: string): boolean {
  const data = readData();
  return Boolean(data.postedNotifications?.[dateString]);
}

export function markNotificationPosted(dateString: string): void {
  const data = readData();
  data.postedNotifications = data.postedNotifications || {};
  data.postedNotifications[dateString] = true;
  writeData(data);
}

export function getTodayLeaderboard(todayDateStr: string, guildId: string = "global"): LeaderboardEntry[] {
  const data = readData();
  const targetGuild = guildId || "global";

  const filtered = data.entries.filter((entry) => {
    const entryGuild = entry.guildId || "global";
    return entry.dateString === todayDateStr && entryGuild === targetGuild;
  });

  return filtered.sort((a, b) => {
    if (a.gameStatus === "WON" && b.gameStatus !== "WON") return -1;
    if (a.gameStatus !== "WON" && b.gameStatus === "WON") return 1;
    if (a.gameStatus === "WON" && b.gameStatus === "WON") {
      if (a.attempts !== b.attempts) {
        return a.attempts - b.attempts;
      }
    }
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
}

export function addOrUpdateLeaderboardEntry(
  entryData: Omit<LeaderboardEntry, "id" | "completedAt">
): LeaderboardEntry[] {
  const data = readData();
  const todayDateStr = entryData.dateString;
  const targetGuild = entryData.guildId || "global";

  const entryId = `${todayDateStr}_${targetGuild}_${entryData.user.id}`;

  const existingIndex = data.entries.findIndex((item) => {
    const itemGuild = item.guildId || "global";
    return (
      item.dateString === todayDateStr &&
      itemGuild === targetGuild &&
      item.user.id === entryData.user.id
    );
  });

  const newEntry: LeaderboardEntry = {
    ...entryData,
    guildId: targetGuild,
    id: entryId,
    completedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    data.entries[existingIndex] = newEntry;
  } else {
    data.entries.push(newEntry);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffStr = sevenDaysAgo.toISOString().slice(0, 10);
  data.entries = data.entries.filter((item) => item.dateString >= cutoffStr);

  writeData(data);

  return getTodayLeaderboard(todayDateStr, targetGuild);
}

export function getAllLeaderboardsForDate(todayDateStr: string): Record<string, LeaderboardEntry[]> {
  const data = readData();
  const entriesForDate = data.entries.filter((entry) => entry.dateString === todayDateStr);

  const grouped: Record<string, LeaderboardEntry[]> = {};
  for (const entry of entriesForDate) {
    const gId = entry.guildId || "global";
    if (!grouped[gId]) {
      grouped[gId] = [];
    }
    grouped[gId].push(entry);
  }
  return grouped;
}
