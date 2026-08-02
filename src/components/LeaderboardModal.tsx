"use client";

import React, { useEffect, useState } from "react";
import { X, Trophy, ChevronDown, ChevronUp, User, Server } from "lucide-react";

export interface LeaderboardEntry {
  id: string;
  user: {
    id: string;
    username: string;
    globalName?: string;
    avatarUrl?: string;
  };
  dateString: string;
  guesses: string[];
  gameStatus: "WON" | "LOST";
  attempts: number;
  completedAt: string;
  guildId?: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  solution: string;
  dayNumber: number;
  currentUserId?: string;
  guildId?: string | null;
}

const MiniGridRow: React.FC<{ guess: string; solution: string }> = ({ guess, solution }) => {
  const targetChars = solution.split("");
  const guessChars = guess.split("");

  const statuses: Array<"CORRECT" | "PRESENT" | "ABSENT"> = new Array(5).fill("ABSENT");
  const targetUsed = new Array(5).fill(false);

  // 1ª Passagem: Verdes
  guessChars.forEach((char, idx) => {
    if (char === targetChars[idx]) {
      statuses[idx] = "CORRECT";
      targetUsed[idx] = true;
    }
  });

  // 2ª Passagem: Amarelos
  guessChars.forEach((char, idx) => {
    if (statuses[idx] !== "CORRECT") {
      const matchIndex = targetChars.findIndex(
        (tChar, tIdx) => tChar === char && !targetUsed[tIdx]
      );
      if (matchIndex !== -1) {
        statuses[idx] = "PRESENT";
        targetUsed[matchIndex] = true;
      }
    }
  });

  return (
    <div className="flex gap-1 justify-center my-0.5">
      {guessChars.map((char, idx) => {
        const st = statuses[idx];
        let bgClass = "bg-[#4e5058]";
        if (st === "CORRECT") bgClass = "bg-[#23a55a]";
        if (st === "PRESENT") bgClass = "bg-[#f0b232]";

        return (
          <div
            key={idx}
            className={`w-6 h-6 sm:w-7 sm:h-7 ${bgClass} text-white font-black flex items-center justify-center rounded text-xs sm:text-sm uppercase shadow-sm`}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
};

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  solution,
  dayNumber,
  currentUserId,
  guildId,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const targetGuild = guildId || "global";
      const res = await fetch(`/api/leaderboard?guildId=${encodeURIComponent(targetGuild)}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard || []);
      }
    } catch (e) {
      console.error("Erro ao buscar leaderboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, guildId]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const isServerSpecific = guildId && guildId !== "global";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1e1f22] text-[#f2f3f5] rounded-2xl shadow-2xl border border-[#35363c] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-[#35363c] bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <Trophy size={22} className="text-[#f0b232]" />
            <div className="flex flex-col">
              <h2 className="text-lg font-black tracking-wide">Placar do Dia #{dayNumber}</h2>
              {isServerSpecific ? (
                <span className="text-[10px] text-[#5865f2] font-bold flex items-center gap-1">
                  <Server size={11} /> Placar deste Servidor
                </span>
              ) : (
                <span className="text-[10px] text-[#949ba4] font-bold">
                  Placar Geral Web
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#949ba4] hover:text-white hover:bg-[#35363c] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informação sobre Reset Diário */}
        <div className="bg-[#2b2d31]/50 px-4 py-2 text-xs text-[#949ba4] border-b border-[#35363c] flex justify-between items-center">
          <span>Reseta todos os dias com a nova palavra!</span>
          <button
            onClick={fetchLeaderboard}
            className="text-[#5865f2] hover:underline font-semibold"
          >
            Atualizar 🔄
          </button>
        </div>

        {/* Lista de Jogadores */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {loading && entries.length === 0 ? (
            <div className="text-center py-8 text-[#949ba4] text-sm animate-pulse">
              Carregando o placar do servidor...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-[#949ba4] text-sm">
              {isServerSpecific
                ? "Nenhum membro deste servidor concluiu a palavra de hoje ainda! 🚀"
                : "Nenhum jogador concluiu a palavra do dia ainda. Seja o primeiro! 🚀"}
            </div>
          ) : (
            entries.map((entry, index) => {
              const isCurrentUser = currentUserId && entry.user.id === currentUserId;
              const isExpanded = expandedId === entry.id;

              let rankBadge = null;
              if (index === 0) rankBadge = "🥇";
              else if (index === 1) rankBadge = "🥈";
              else if (index === 2) rankBadge = "🥉";
              else rankBadge = `#${index + 1}`;

              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border transition-all ${
                    isCurrentUser
                      ? "border-[#5865f2] bg-[#5865f2]/10"
                      : "border-[#35363c] bg-[#2b2d31]"
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(entry.id)}
                    className="p-3 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm min-w-[24px] text-center text-[#949ba4]">
                        {rankBadge}
                      </span>

                      {/* Avatar */}
                      {entry.user.avatarUrl ? (
                        <img
                          src={entry.user.avatarUrl}
                          alt={entry.user.username}
                          className="w-9 h-9 rounded-full border border-[#4e5058] object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm">
                          <User size={18} />
                        </div>
                      )}

                      {/* Nome do Jogador */}
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white flex items-center gap-1.5">
                          {entry.user.globalName || entry.user.username}
                          {isCurrentUser && (
                            <span className="text-[10px] bg-[#5865f2] text-white px-1.5 py-0.2 rounded-full font-normal">
                              Você
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[#949ba4]">
                          @{entry.user.username}
                        </span>
                      </div>
                    </div>

                    {/* Status & Botão de Expansão */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {entry.gameStatus === "WON" ? (
                          <span className="inline-block bg-[#23a55a]/20 text-[#23a55a] text-xs px-2 py-0.5 rounded-full font-bold">
                            {entry.attempts}/6 🎯
                          </span>
                        ) : (
                          <span className="inline-block bg-[#da373c]/20 text-[#da373c] text-xs px-2 py-0.5 rounded-full font-bold">
                            X/6 ❌
                          </span>
                        )}
                      </div>
                      <button className="text-[#949ba4] hover:text-white p-1">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Grid de Palpites Expansível */}
                  {isExpanded && (
                    <div className="p-3 border-t border-[#35363c] bg-[#1e1f22]/60 rounded-b-xl flex flex-col items-center">
                      <span className="text-xs text-[#949ba4] mb-2 font-medium">
                        Tentativas de {entry.user.globalName || entry.user.username}:
                      </span>
                      {entry.guesses.map((guess, idx) => (
                        <MiniGridRow key={idx} guess={guess} solution={solution} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
