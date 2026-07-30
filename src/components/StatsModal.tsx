"use client";

import React from "react";
import { X, Trophy } from "lucide-react";
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
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  guesses,
  displaySolution,
  gameStatus,
}) => {
  if (!isOpen) return null;

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const maxDistribution = Math.max(...Object.values(stats.guessDistribution), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1e1f22] border border-[#35363c] rounded-2xl p-6 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#949ba4] hover:text-white p-1 rounded-lg hover:bg-[#2b2d31] transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-center mb-5 flex items-center justify-center gap-2">
          <Trophy size={22} className="text-[#f0b232]" />
          Estatísticas & Placar
        </h2>

        {/* Quadro Principal de Números */}
        <div className="grid grid-cols-4 gap-2 text-center mb-6">
          <div className="bg-[#2b2d31] p-3 rounded-xl">
            <div className="text-2xl font-black">{stats.gamesPlayed}</div>
            <div className="text-[10px] text-[#949ba4] uppercase font-bold">Jogos</div>
          </div>
          <div className="bg-[#2b2d31] p-3 rounded-xl">
            <div className="text-2xl font-black">{winRate}%</div>
            <div className="text-[10px] text-[#949ba4] uppercase font-bold">Vitórias</div>
          </div>
          <div className="bg-[#2b2d31] p-3 rounded-xl">
            <div className="text-2xl font-black text-[#23a55a]">{stats.currentStreak}</div>
            <div className="text-[10px] text-[#949ba4] uppercase font-bold">Sequência</div>
          </div>
          <div className="bg-[#2b2d31] p-3 rounded-xl">
            <div className="text-2xl font-black text-[#f0b232]">{stats.maxStreak}</div>
            <div className="text-[10px] text-[#949ba4] uppercase font-bold">Melhor</div>
          </div>
        </div>

        {/* Gráfico de Distribuição */}
        <h3 className="text-sm font-bold text-[#949ba4] uppercase tracking-wider mb-3">
          Distribuição de Tentativas
        </h3>
        <div className="space-y-1.5 mb-4">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const count = stats.guessDistribution[num] || 0;
            const pct = Math.max(8, Math.round((count / maxDistribution) * 100));
            const isCurrentAttempt = gameStatus === "WON" && guesses.length === num;

            return (
              <div key={num} className="flex items-center gap-2 text-xs font-bold">
                <span className="w-3 text-right text-[#949ba4]">{num}</span>
                <div
                  className={`h-6 rounded-md flex items-center justify-end px-2 transition-all ${
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
          <div className="border-t border-[#35363c] pt-4 flex flex-col items-center">
            <span className="text-xs text-[#949ba4]">Palavra secreta de hoje:</span>
            <div className="text-xl font-black text-[#23a55a] tracking-widest uppercase mt-1">
              {displaySolution}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
