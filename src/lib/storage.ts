export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // { 1: 0, 2: 5, 3: 12, ... 6: 2 }
}

export interface SavedGameState {
  dateString: string;
  guesses: string[];
  gameStatus: "IN_PROGRESS" | "WON" | "LOST";
}

const STATS_KEY = "palavrita_stats_v1";
const GAME_STATE_KEY = "palavrita_daily_state_v1";

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
};

export function loadStats(): GameStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : DEFAULT_STATS;
  } catch (e) {
    console.error("Erro ao carregar estatísticas:", e);
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: GameStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Erro ao salvar estatísticas:", e);
  }
}

export function loadGameState(todayDateStr: string): SavedGameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return null;
    const parsed: SavedGameState = JSON.parse(raw);
    if (parsed.dateString === todayDateStr) {
      return parsed;
    }
    return null; // Estado expirou (dia diferente)
  } catch (e) {
    console.error("Erro ao carregar estado do jogo:", e);
    return null;
  }
}

export function saveGameState(state: SavedGameState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Erro ao salvar estado do jogo:", e);
  }
}

export function recordGameFinished(won: boolean, attempts: number): GameStats {
  const stats = loadStats();
  stats.gamesPlayed += 1;

  if (won) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.guessDistribution[attempts] = (stats.guessDistribution[attempts] || 0) + 1;
  } else {
    stats.currentStreak = 0;
  }

  saveStats(stats);
  return stats;
}
