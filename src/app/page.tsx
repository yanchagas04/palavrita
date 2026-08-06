"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { Grid } from "@/components/Grid";
import { Keyboard } from "@/components/Keyboard";
import { StatsModal } from "@/components/StatsModal";
import { HelpModal } from "@/components/HelpModal";
import { Trophy, RefreshCw } from "lucide-react";
import { LeaderboardModal } from "@/components/LeaderboardModal";
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
  const { user, guildId, channelId } = useDiscord();
  
  // Palavra determinística inicial para a sessão
  const [dailyInfo, setDailyInfo] = useState<DailyWordInfo>(() =>
    getDailyWord(getTodayDateString(), false)
  );

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [selectedTileIndex, setSelectedTileIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState<"IN_PROGRESS" | "WON" | "LOST">("IN_PROGRESS");
  const [isShakeRow, setIsShakeRow] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [stats, setStats] = useState<GameStats>(() => loadStats());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const submitGameToLeaderboard = async (
    finalGuesses: string[],
    status: "IN_PROGRESS" | "WON" | "LOST"
  ) => {
    if (!user) return;
    try {
      await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          dateString: dailyInfo.dateString,
          guesses: finalGuesses,
          gameStatus: status,
          guildId: guildId || "global",
          channelId: channelId || undefined,
        }),
      });
    } catch (e) {
      console.error("Erro ao enviar jogo para o leaderboard:", e);
    }
  };

  // Carrega estado salvo localmente se NÃO estiver no modo Dev
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

  // Sincroniza estado salvo no Supabase via conta do Discord do usuário entre plataformas
  useEffect(() => {
    if (!user?.id) return;

    const syncDiscordProgress = async () => {
      try {
        const res = await fetch(
          `/api/leaderboard/user?userId=${encodeURIComponent(user.id)}&date=${encodeURIComponent(
            dailyInfo.dateString
          )}&guildId=${encodeURIComponent(guildId || "global")}`
        );

        if (res.ok) {
          const data = await res.json();
          if (data.entry && Array.isArray(data.entry.guesses) && data.entry.guesses.length > 0) {
            setGuesses(data.entry.guesses);
            setGameStatus(data.entry.gameStatus);
            if (data.entry.gameStatus !== "IN_PROGRESS") {
              setIsStatsOpen(true);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar progresso do Discord:", err);
      }
    };

    syncDiscordProgress();
  }, [user?.id, dailyInfo.dateString, guildId]);

  // Botão de Reset Dev Mode / Modo Prática
  const handlePlayPracticeMode = () => {
    const newWordInfo = getDailyWord(undefined, true); // forceRandom = true
    setDailyInfo(newWordInfo);
    setGuesses([]);
    setCurrentGuess("");
    setSelectedTileIndex(0);
    setGameStatus("IN_PROGRESS");
    setIsStatsOpen(false);
    showToast("Modo Prática iniciado!");
  };

  const letterStatuses = getLetterStatuses(guesses, dailyInfo.wordEntry.normalized);

  const triggerShake = () => {
    setIsShakeRow(true);
    setTimeout(() => setIsShakeRow(false), 500);
  };

  const handleChar = (char: string) => {
    if (gameStatus !== "IN_PROGRESS") return;

    const chars = Array.from({ length: 5 }, (_, i) => currentGuess[i] || "");
    chars[selectedTileIndex] = char.toUpperCase();
    const updatedGuess = chars.join("");
    setCurrentGuess(updatedGuess);

    // Avança para a próxima posição vazia ou para a próxima à direita
    let nextIndex = selectedTileIndex + 1;
    if (nextIndex < 5 && chars[nextIndex] !== "") {
      const firstEmpty = chars.findIndex((c, idx) => idx > selectedTileIndex && c === "");
      if (firstEmpty !== -1) {
        nextIndex = firstEmpty;
      }
    }
    setSelectedTileIndex(Math.min(4, nextIndex));
  };

  const handleDelete = () => {
    if (gameStatus !== "IN_PROGRESS") return;

    const chars = Array.from({ length: 5 }, (_, i) => currentGuess[i] || "");
    if (chars[selectedTileIndex] !== "") {
      chars[selectedTileIndex] = "";
      setCurrentGuess(chars.join("").trimEnd());
    } else if (selectedTileIndex > 0) {
      const prevIndex = selectedTileIndex - 1;
      chars[prevIndex] = "";
      setCurrentGuess(chars.join("").trimEnd());
      setSelectedTileIndex(prevIndex);
    }
  };

  const handleEnter = () => {
    if (gameStatus !== "IN_PROGRESS") return;

    const fullGuess = Array.from({ length: 5 }, (_, i) => currentGuess[i] || "").join("");

    if (fullGuess.length !== 5 || fullGuess.includes(" ")) {
      showToast("Letras insuficientes");
      triggerShake();
      return;
    }

    const normalizedGuess = normalizeWord(fullGuess);

    if (!VALID_GUESSES_SET.has(normalizedGuess)) {
      showToast("Palavra não encontrada");
      triggerShake();
      return;
    }

    const newGuesses = [...guesses, normalizedGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");
    setSelectedTileIndex(0);

    const isWin = normalizedGuess === dailyInfo.wordEntry.normalized;
    const isLoss = newGuesses.length >= 6 && !isWin;

    const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";
    const isPractice = isDev || dailyInfo.dateString.includes("_dev_");

    if (isWin) {
      setGameStatus("WON");

      if (!isPractice) {
        const updatedStats = recordGameFinished(true, newGuesses.length);
        setStats(updatedStats);
        submitGameToLeaderboard(newGuesses, "WON");
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

      if (!isPractice) {
        const updatedStats = recordGameFinished(false, newGuesses.length);
        setStats(updatedStats);
        submitGameToLeaderboard(newGuesses, "LOST");
        saveGameState({
          dateString: dailyInfo.dateString,
          guesses: newGuesses,
          gameStatus: "LOST",
        });
      }

      setTimeout(() => setIsStatsOpen(true), 1500);
    } else {
      // Salva progresso intermediário apenas em partidas oficiais
      if (!isPractice) {
        submitGameToLeaderboard(newGuesses, "IN_PROGRESS");
        saveGameState({
          dateString: dailyInfo.dateString,
          guesses: newGuesses,
          gameStatus: "IN_PROGRESS",
        });
      }
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isHelpOpen || isStatsOpen || isLeaderboardOpen) return;

      if (e.key === "Enter") {
        handleEnter();
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "ArrowLeft") {
        setSelectedTileIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedTileIndex((prev) => Math.min(4, prev + 1));
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleChar(e.key);
      }
    },
    [currentGuess, selectedTileIndex, guesses, gameStatus, isHelpOpen, isStatsOpen, isLeaderboardOpen, dailyInfo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <main className="flex flex-col items-center justify-between min-h-screen bg-[#1e1f22] text-[#f2f3f5] overflow-hidden select-none pb-4 sm:pb-2 pt-14 sm:pt-0">
      <Header
        dayNumber={dailyInfo.dayNumber}
        user={user}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onResetDevWord={handlePlayPracticeMode}
      />

      {/* Botões superiores */}
      <div className="w-full flex justify-center items-center gap-2 pt-3 pb-1">
        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] active:scale-95 text-white text-xs sm:text-sm font-black rounded-full shadow-md transition-all cursor-pointer"
        >
          <Trophy size={16} className="text-[#f0b232]" />
          <span>Placar</span>
        </button>

        {gameStatus !== "IN_PROGRESS" && (
          <button
            onClick={handlePlayPracticeMode}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#23a55a] hover:bg-[#1db954] active:scale-95 text-white text-xs sm:text-sm font-black rounded-full shadow-md transition-all cursor-pointer animate-pop"
          >
            <RefreshCw size={16} />
            <span>Jogar Novamente</span>
          </button>
        )}
      </div>

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
        selectedIndex={selectedTileIndex}
        onSelectTile={(index) => setSelectedTileIndex(index)}
        disabled={gameStatus !== "IN_PROGRESS"}
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
        onPlayPracticeMode={handlePlayPracticeMode}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        solution={dailyInfo.wordEntry.normalized}
        dayNumber={dailyInfo.dayNumber}
        currentUserId={user?.id}
        guildId={guildId}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  );
}
