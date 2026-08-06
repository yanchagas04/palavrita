"use client";

import React from "react";
import { X, Trophy, RefreshCw, Flame, Target, Percent, Gamepad2 } from "lucide-react";
import { GameStats } from "@/lib/storage";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  dayNumber: number;
  guesses: string[];
  solution: string;
  displaySolution: string;
  gameStatus: "IN_PROGRESS" | "WON" | "LOST";
  onPlayPracticeMode?: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  guesses,
  displaySolution,
  gameStatus,
  onPlayPracticeMode,
}) => {
  if (!isOpen) return null;

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const maxDistribution = Math.max(...Object.values(stats.guessDistribution), 1);

  // Média de chutes para acertar nas partidas vencidas
  const totalGuessesInWins = Object.entries(stats.guessDistribution).reduce(
    (acc, [attempts, count]) => acc + Number(attempts) * count,
    0
  );
  const avgGuesses = stats.gamesWon > 0 ? (totalGuessesInWins / stats.gamesWon).toFixed(1) : "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1e1f22] border border-[#35363c] rounded-2xl p-6 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#949ba4] hover:text-white p-1 rounded-lg hover:bg-[#2b2d31] transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-center mb-5 flex items-center justify-center gap-2">
          <Trophy size={22} className="text-[#f0b232]" />
          Estatísticas & Desempenho
        </h2>

        {/* Quadro Principal de Estatísticas Detalhadas */}
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          <div className="bg-[#2b2d31] p-2.5 rounded-xl border border-[#35363c]/50 flex flex-col items-center">
            <Gamepad2 size={16} className="text-[#949ba4] mb-1" />
            <div className="text-xl font-black">{stats.gamesPlayed}</div>
            <div className="text-[9px] text-[#949ba4] uppercase font-bold">Jogos</div>
          </div>

          <div className="bg-[#2b2d31] p-2.5 rounded-xl border border-[#35363c]/50 flex flex-col items-center">
            <Percent size={16} className="text-[#5865f2] mb-1" />
            <div className="text-xl font-black text-[#5865f2]">{winRate}%</div>
            <div className="text-[9px] text-[#949ba4] uppercase font-bold">Vitórias</div>
          </div>

          <div className="bg-[#2b2d31] p-2.5 rounded-xl border border-[#35363c]/50 flex flex-col items-center">
            <Flame size={16} className="text-[#23a55a] mb-1" />
            <div className="text-xl font-black text-[#23a55a]">{stats.currentStreak}</div>
            <div className="text-[9px] text-[#949ba4] uppercase font-bold">Sequência</div>
          </div>

          <div className="bg-[#2b2d31] p-2.5 rounded-xl border border-[#35363c]/50 flex flex-col items-center">
            <Target size={16} className="text-[#f0b232] mb-1" />
            <div className="text-xl font-black text-[#f0b232]">{avgGuesses}</div>
            <div className="text-[9px] text-[#949ba4] uppercase font-bold">Média Chutes</div>
          </div>
        </div>

        {/* Informação da Melhor Sequência */}
        <div className="bg-[#2b2d31]/60 px-3 py-1.5 rounded-lg border border-[#35363c]/40 flex justify-between items-center text-xs mb-5 text-[#dbdee1]">
          <span className="text-[#949ba4]">Melhor Sequência de Dias:</span>
          <span className="font-bold text-[#f0b232] flex items-center gap-1">
            🔥 {stats.maxStreak} {stats.maxStreak === 1 ? "dia" : "dias"}
          </span>
        </div>

        {/* Gráfico de Distribuição */}
        <h3 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider mb-2.5">
          Distribuição de Tentativas
        </h3>
        <div className="space-y-1.5 mb-5">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const count = stats.guessDistribution[num] || 0;
            const pct = Math.max(8, Math.round((count / maxDistribution) * 100));
            const isCurrentAttempt = gameStatus === "WON" && guesses.length === num;

            return (
              <div key={num} className="flex items-center gap-2 text-xs font-bold">
                <span className="w-3 text-right text-[#949ba4]">{num}</span>
                <div
                  className={`h-5.5 rounded-md flex items-center justify-end px-2 transition-all ${
                    isCurrentAttempt ? "bg-[#23a55a] text-white" : "bg-[#2b2d31] text-[#949ba4]"
                  }`}
                  style={{ width: `${pct}%` }}
                >
                  {count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Se o jogo tiver terminado */}
        {gameStatus !== "IN_PROGRESS" && (
          <div className="border-t border-[#35363c] pt-4 flex flex-col items-center gap-3">
            <div className="text-center">
              <span className="text-xs text-[#949ba4]">Palavra secreta de hoje:</span>
              <div className="text-xl font-black text-[#23a55a] tracking-widest uppercase mt-0.5">
                {displaySolution}
              </div>
            </div>

            {onPlayPracticeMode && (
              <button
                onClick={() => {
                  onClose();
                  onPlayPracticeMode();
                }}
                className="w-full py-2.5 px-4 bg-[#23a55a] hover:bg-[#1db954] active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-sm"
              >
                <RefreshCw size={16} />
                <span>Continuar Jogando (Prática)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
