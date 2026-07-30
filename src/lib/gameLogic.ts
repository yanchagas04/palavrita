export type LetterStatus = "correct" | "present" | "absent";

export interface GuessEvaluation {
  guess: string;
  statuses: LetterStatus[];
}

/**
 * Avalia cada letra de um chute de 5 letras em relação à solução
 */
export function evaluateGuess(guess: string, solution: string): LetterStatus[] {
  const result: LetterStatus[] = Array(5).fill("absent");
  const solutionArr = solution.split("");
  const guessArr = guess.split("");

  // Passagem 1: Letras corretas na posição exata (VERDE / correct)
  guessArr.forEach((letter, i) => {
    if (letter === solutionArr[i]) {
      result[i] = "correct";
      solutionArr[i] = ""; // Letra consumida
    }
  });

  // Passagem 2: Letras presentes em outra posição (AMARELO / present)
  guessArr.forEach((letter, i) => {
    if (result[i] !== "correct") {
      const foundIdx = solutionArr.indexOf(letter);
      if (foundIdx !== -1) {
        result[i] = "present";
        solutionArr[foundIdx] = ""; // Letra consumida
      }
    }
  });

  return result;
}

/**
 * Mapeia o status de cada letra para colorir o teclado virtual
 */
export function getLetterStatuses(guesses: string[], solution: string): Record<string, LetterStatus> {
  const map: Record<string, LetterStatus> = {};

  guesses.forEach((guess) => {
    const statuses = evaluateGuess(guess, solution);
    guess.split("").forEach((letter, i) => {
      const currentStatus = map[letter];
      const newStatus = statuses[i];

      // Prioridade: correct > present > absent
      if (newStatus === "correct") {
        map[letter] = "correct";
      } else if (newStatus === "present" && currentStatus !== "correct") {
        map[letter] = "present";
      } else if (!currentStatus) {
        map[letter] = "absent";
      }
    });
  });

  return map;
}

/**
 * Gera a string de emojis para compartilhar o resultado no Discord
 */
export function generateShareText(
  dayNumber: number,
  guesses: string[],
  solution: string,
  won: boolean
): string {
  const attemptsText = won ? `${guesses.length}/6` : "X/6";
  const lines = [`Palavrita #${dayNumber} ${attemptsText}\n`];

  guesses.forEach((guess) => {
    const statuses = evaluateGuess(guess, solution);
    const line = statuses
      .map((status) => {
        if (status === "correct") return "🟩";
        if (status === "present") return "🟨";
        return "⬛";
      })
      .join("");
    lines.push(line);
  });

  return lines.join("\n");
}
