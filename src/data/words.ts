import wordsData from "./words.json";
import commonWordsData from "./common_words.json";

export interface WordEntry {
  normalized: string; // Para comparação no jogo/teclado (ex: "AMAGO")
  display: string;    // Para exibição com acento (ex: "ÂMAGO")
}

// 1. Lista Completa de Chutes Permitidos (13.756 palavras)
export const ALL_WORDS_LIST: WordEntry[] = wordsData
  .map((item) => ({
    normalized: item.n.toUpperCase().trim(),
    display: item.d.toUpperCase().trim(),
  }))
  .filter((w) => w.normalized.length === 5 && w.display.length === 5);

// Set para validação ultra-rápida de chutes
export const VALID_GUESSES_SET = new Set<string>(ALL_WORDS_LIST.map((w) => w.normalized));

// 2. Lista Curada de Palavras Secretas Diárias (1.500 palavras mais comuns do Português)
export const DAILY_SECRET_WORDS: WordEntry[] = commonWordsData
  .map((item) => ({
    normalized: item.n.toUpperCase().trim(),
    display: item.d.toUpperCase().trim(),
  }))
  .filter((w) => w.normalized.length === 5 && w.display.length === 5);

/**
 * Normaliza uma palavra tirando acentos e cedilha para comparação
 */
export function normalizeWord(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z]/g, "");
}
