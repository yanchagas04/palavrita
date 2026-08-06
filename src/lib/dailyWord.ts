import { DAILY_SECRET_WORDS, WordEntry } from "@/data/words";

const START_DATE = new Date("2026-01-01T00:00:00-03:00");

export interface DailyWordInfo {
  wordEntry: WordEntry;
  dayNumber: number;
  dateString: string;
}

/**
 * Gerador pseudo-aleatório (Seeded PRNG) baseado no número do dia.
 * Garante que a palavra seja aleatória e imprevisível a cada dia,
 * mas IGUAL para todos os jogadores que jogarem no mesmo dia.
 */
function getSeededIndex(seed: number, max: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const randomValue = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return Math.floor(randomValue * max);
}

export function getTodayDateString(): string {
  const now = new Date();
  const brtDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const year = brtDate.getFullYear();
  const month = String(brtDate.getMonth() + 1).padStart(2, "0");
  const day = String(brtDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyWord(
  dateStr: string = getTodayDateString(),
  forceRandom: boolean = false
): DailyWordInfo {
  // Sorteia palavra totalmente aleatória no modo dev ao clicar no botão de reset
  if (forceRandom) {
    const randomIndex = Math.floor(Math.random() * DAILY_SECRET_WORDS.length);
    return {
      wordEntry: DAILY_SECRET_WORDS[randomIndex],
      dayNumber: Math.floor(Math.random() * 999) + 1,
      dateString: `${dateStr}_dev_${Date.now()}`,
    };
  }

  const targetDate = new Date(`${dateStr}T00:00:00-03:00`);
  const diffTime = targetDate.getTime() - START_DATE.getTime();
  const dayIndex = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  // Utiliza a semente determinística do dia para sortear uma palavra aleatória da lista
  const wordIndex = getSeededIndex(dayIndex, DAILY_SECRET_WORDS.length);
  
  return {
    wordEntry: DAILY_SECRET_WORDS[wordIndex],
    dayNumber: dayIndex + 1,
    dateString: dateStr,
  };
}
