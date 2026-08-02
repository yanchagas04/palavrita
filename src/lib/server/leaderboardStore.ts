import fs from "fs";
import path from "path";

export interface LeaderboardUser {
  id: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
}

export interface LeaderboardEntry {
  id: string; // ID único do registro ou do usuário
  user: LeaderboardUser;
  dateString: string; // Data no formato YYYY-MM-DD
  guesses: string[];
  gameStatus: "WON" | "LOST";
  attempts: number;
  completedAt: string; // ISO string
}

// Arquivo para persistência simples no ambiente de servidor
const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "leaderboard.json");

function ensureFileExists(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify({ entries: [] }, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Erro ao criar estrutura de armazenamento do leaderboard:", e);
  }
}

function readData(): { entries: LeaderboardEntry[] } {
  try {
    ensureFileExists();
    const content = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error("Erro ao ler leaderboard:", e);
    return { entries: [] };
  }
}

function writeData(data: { entries: LeaderboardEntry[] }): void {
  try {
    ensureFileExists();
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Erro ao salvar leaderboard:", e);
  }
}

export function getTodayLeaderboard(todayDateStr: string): LeaderboardEntry[] {
  const data = readData();
  // Retorna apenas entradas do dia solicitado, ordenadas: Vitoriosos primeiro (menor tentativa e mais recente), depois Derrotas
  const filtered = data.entries.filter((entry) => entry.dateString === todayDateStr);
  
  return filtered.sort((a, b) => {
    if (a.gameStatus === "WON" && b.gameStatus !== "WON") return -1;
    if (a.gameStatus !== "WON" && b.gameStatus === "WON") return 1;
    if (a.gameStatus === "WON" && b.gameStatus === "WON") {
      if (a.attempts !== b.attempts) {
        return a.attempts - b.attempts; // Menos tentativas primeiro
      }
    }
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
}

export function addOrUpdateLeaderboardEntry(entryData: Omit<LeaderboardEntry, "id" | "completedAt">): LeaderboardEntry[] {
  const data = readData();
  const todayDateStr = entryData.dateString;

  const entryId = `${todayDateStr}_${entryData.user.id}`;
  
  const existingIndex = data.entries.findIndex(
    (item) => item.dateString === todayDateStr && item.user.id === entryData.user.id
  );

  const newEntry: LeaderboardEntry = {
    ...entryData,
    id: entryId,
    completedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    // Atualiza a entrada existente se for o mesmo usuário no mesmo dia
    data.entries[existingIndex] = newEntry;
  } else {
    data.entries.push(newEntry);
  }

  // Opcional: Limpar registros com mais de 7 dias para evitar crescimento desmedido do JSON
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffStr = sevenDaysAgo.toISOString().slice(0, 10);
  data.entries = data.entries.filter((item) => item.dateString >= cutoffStr);

  writeData(data);

  return getTodayLeaderboard(todayDateStr);
}
