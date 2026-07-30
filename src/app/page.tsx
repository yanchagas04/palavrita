"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { Grid } from "@/components/Grid";
import { Keyboard } from "@/components/Keyboard";
import { StatsModal } from "@/components/StatsModal";
import { HelpModal } from "@/components/HelpModal";
import { useDiscord } from "@/hooks/useDiscord";
import { getDailyWord, getTodayDateString, DailyWordInfo } from "@/lib/dailyWord";
import { VALID_GUESSES_SET, normalizeWord } from "@/data/words";
import { getLetterStatuses } from "@/lib/gameLogic";
import {
  loadGameState,
  saveGameState,
  loadStats,
  recordGameFinished,
  GameStats,
} from "@/lib/storage";

export default function Home() {
  const { user } = useDiscord();
  
  // Palavra determinística inicial para a sessão
  const [dailyInfo, setDailyInfo] = useState<DailyWordInfo>(() =>
    getDailyWord(getTodayDateString(), false)
  );

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState<"IN_PROGRESS" | "WON" | "LOST">("IN_PROGRESS");
  const [isShakeRow, setIsShakeRow] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [stats, setStats] = useState<GameStats>(() => loadStats());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Carrega estado salvo se NÃO estiver no modo Dev
  useEffect(() => {
    const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";
    if (!isDev) {
      const todayStr = dailyInfo.dateString;
      const savedState = loadGameState(todayStr);

      if (savedState) {
        setGuesses(savedState.guesses);
        setGameStatus(savedState.gameStatus);
        if (savedState.gameStatus !== "IN_PROGRESS") {
          setIsStatsOpen(true);
        }
      }
    }
  }, []);

  // Botão 🔄 do Dev Mode para sortear uma nova palavra voluntariamente
  const handleResetDevWord = () => {
    const newWordInfo = getDailyWord(undefined, true); // forceRandom = true
    setDailyInfo(newWordInfo);
    setGuesses([]);
    setCurrentGuess("");
    setGameStatus("IN_PROGRESS");
    setIsStatsOpen(false);
    showToast("Nova palavra sorteada!");
  };

  const letterStatuses = getLetterStatuses(guesses, dailyInfo.wordEntry.normalized);

  const triggerShake = () => {
    setIsShakeRow(true);
    setTimeout(() => setIsShakeRow(false), 500);
  };

  const handleChar = (char: string) => {
    if (gameStatus !== "IN_PROGRESS") return;
    if (currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + char.toUpperCase());
    }
  };

  const handleDelete = () => {
    if (gameStatus !== "IN_PROGRESS") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (gameStatus !== "IN_PROGRESS") return;

    if (currentGuess.length !== 5) {
      showToast("Letras insuficientes");
      triggerShake();
      return;
    }

    const normalizedGuess = normalizeWord(currentGuess);

    if (!VALID_GUESSES_SET.has(normalizedGuess)) {
      showToast("Palavra não encontrada");
      triggerShake();
      return;
    }

    const newGuesses = [...guesses, normalizedGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    const isWin = normalizedGuess === dailyInfo.wordEntry.normalized;
    const isLoss = newGuesses.length >= 6 && !isWin;

    const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";

    if (isWin) {
      setGameStatus("WON");
      const updatedStats = recordGameFinished(true, newGuesses.length);
      setStats(updatedStats);
      if (!isDev) {
        saveGameState({
          dateString: dailyInfo.dateString,
          guesses: newGuesses,
          gameStatus: "WON",
        });
      }

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      setTimeout(() => setIsStatsOpen(true), 1500);
    } else if (isLoss) {
      setGameStatus("LOST");
      const updatedStats = recordGameFinished(false, newGuesses.length);
      setStats(updatedStats);
      if (!isDev) {
        saveGameState({
          dateString: dailyInfo.dateString,
          guesses: newGuesses,
          gameStatus: "LOST",
        });
      }

      setTimeout(() => setIsStatsOpen(true), 1500);
    } else if (!isDev) {
      saveGameState({
        dateString: dailyInfo.dateString,
        guesses: newGuesses,
        gameStatus: "IN_PROGRESS",
      });
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isHelpOpen || isStatsOpen) return;

      if (e.key === "Enter") {
        handleEnter();
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleChar(e.key);
      }
    },
    [currentGuess, guesses, gameStatus, isHelpOpen, isStatsOpen, dailyInfo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <main className="flex flex-col items-center justify-between min-h-screen bg-[#1e1f22] text-[#f2f3f5] overflow-hidden select-none">
      <Header
        dayNumber={dailyInfo.dayNumber}
        user={user}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onResetDevWord={handleResetDevWord}
      />

      {toastMessage && (
        <div className="absolute top-16 z-40 bg-white text-[#1e1f22] px-4 py-2 rounded-lg font-bold shadow-lg animate-fadeIn text-sm">
          {toastMessage}
        </div>
      )}

      <Grid
        guesses={guesses}
        currentGuess={currentGuess}
        solution={dailyInfo.wordEntry.normalized}
        isShakeRow={isShakeRow}
      />

      <Keyboard
        onChar={handleChar}
        onDelete={handleDelete}
        onEnter={handleEnter}
        letterStatuses={letterStatuses}
        disabled={gameStatus !== "IN_PROGRESS"}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        dayNumber={dailyInfo.dayNumber}
        guesses={guesses}
        solution={dailyInfo.wordEntry.normalized}
        displaySolution={dailyInfo.wordEntry.display}
        gameStatus={gameStatus}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  );
}
