import { DAILY_SECRET_WORDS, WordEntry } from "@/data/words";

const START_DATE = new Date("2026-01-01T00:00:00-03:00");

export interface DailyWordInfo {
  wordEntry: WordEntry;
  dayNumber: number;
  dateString: string;
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
  // Sorteia palavra aleatória APENAS quando solicitado explicitamente
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
  
  const wordIndex = dayIndex % DAILY_SECRET_WORDS.length;
  
  return {
    wordEntry: DAILY_SECRET_WORDS[wordIndex],
    dayNumber: dayIndex + 1,
    dateString: dateStr,
  };
}
