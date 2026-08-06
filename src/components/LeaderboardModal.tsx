"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Trophy,
  ChevronDown,
  ChevronUp,
  User,
  Server,
  Calendar,
  Flame,
  Target,
  Percent,
  Gamepad2,
  ArrowUpDown,
} from "lucide-react";

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

export interface ServerPlayerStats {
  user: {
    id: string;
    username: string;
    globalName?: string;
    avatarUrl?: string;
  };
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  avgAttempts: number;
  currentStreak: number;
  maxStreak: number;
}

type SortMetric = "gamesWon" | "currentStreak" | "winRate" | "avgAttempts" | "gamesPlayed";

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
  const [activeTab, setActiveTab] = useState<"DAILY" | "SERVER">("DAILY");
  const [dailyEntries, setDailyEntries] = useState<LeaderboardEntry[]>([]);
  const [serverStats, setServerStats] = useState<ServerPlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Métrica ativa para ordenação da Tabela do Servidor
  const [sortBy, setSortBy] = useState<SortMetric>("gamesWon");

  const fetchDailyLeaderboard = async () => {
    setLoading(true);
    try {
      const targetGuild = guildId || "global";
      const res = await fetch(`/api/leaderboard?guildId=${encodeURIComponent(targetGuild)}`);
      if (res.ok) {
        const data = await res.json();
        setDailyEntries(data.leaderboard || []);
      }
    } catch (e) {
      console.error("Erro ao buscar leaderboard do dia:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerStats = async () => {
    setLoading(true);
    try {
      const targetGuild = guildId || "global";
      const res = await fetch(
        `/api/leaderboard/server-stats?guildId=${encodeURIComponent(targetGuild)}`
      );
      if (res.ok) {
        const data = await res.json();
        setServerStats(data.playerStats || []);
      }
    } catch (e) {
      console.error("Erro ao buscar estatísticas do servidor:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "DAILY") {
        fetchDailyLeaderboard();
      } else {
        fetchServerStats();
      }
    }
  }, [isOpen, activeTab, guildId]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const isServerSpecific = guildId && guildId !== "global";

  // Ordena a lista da tabela do servidor conforme o filtro selecionado
  const sortedServerStats = [...serverStats].sort((a, b) => {
    if (sortBy === "gamesWon") return b.gamesWon - a.gamesWon || a.avgAttempts - b.avgAttempts;
    if (sortBy === "currentStreak") return b.currentStreak - a.currentStreak || b.gamesWon - a.gamesWon;
    if (sortBy === "winRate") return b.winRate - a.winRate || b.gamesWon - a.gamesWon;
    if (sortBy === "avgAttempts") return a.avgAttempts - b.avgAttempts || b.gamesWon - a.gamesWon;
    if (sortBy === "gamesPlayed") return b.gamesPlayed - a.gamesPlayed || b.gamesWon - a.gamesWon;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1e1f22] text-[#f2f3f5] rounded-2xl shadow-2xl border border-[#35363c] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-[#35363c] bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <Trophy size={22} className="text-[#f0b232]" />
            <div className="flex flex-col">
              <h2 className="text-lg font-black tracking-wide">Placar & Ranking</h2>
              {isServerSpecific ? (
                <span className="text-[10px] text-[#5865f2] font-bold flex items-center gap-1">
                  <Server size={11} /> Estatísticas deste Servidor
                </span>
              ) : (
                <span className="text-[10px] text-[#949ba4] font-bold">Estatísticas Globais</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#949ba4] hover:text-white hover:bg-[#35363c] rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-[#35363c] bg-[#2b2d31]/70 p-1 gap-1">
          <button
            onClick={() => setActiveTab("DAILY")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "DAILY"
                ? "bg-[#5865f2] text-white shadow-md"
                : "text-[#949ba4] hover:text-white hover:bg-[#35363c]/50"
            }`}
          >
            <Calendar size={15} />
            <span>Palavra do Dia #{dayNumber}</span>
          </button>
          <button
            onClick={() => setActiveTab("SERVER")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "SERVER"
                ? "bg-[#5865f2] text-white shadow-md"
                : "text-[#949ba4] hover:text-white hover:bg-[#35363c]/50"
            }`}
          >
            <Trophy size={15} />
            <span>Ranking Geral do Servidor</span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA: PLACAR DO DIA */}
        {activeTab === "DAILY" && (
          <>
            <div className="bg-[#2b2d31]/40 px-4 py-2 text-xs text-[#949ba4] border-b border-[#35363c] flex justify-between items-center">
              <span>Resultado das partidas de hoje</span>
              <button
                onClick={fetchDailyLeaderboard}
                className="text-[#5865f2] hover:underline font-semibold cursor-pointer"
              >
                Atualizar 🔄
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loading && dailyEntries.length === 0 ? (
                <div className="text-center py-8 text-[#949ba4] text-sm animate-pulse">
                  Carregando o placar de hoje...
                </div>
              ) : dailyEntries.length === 0 ? (
                <div className="text-center py-8 text-[#949ba4] text-sm">
                  Nenhum jogador concluiu a palavra do dia ainda. Seja o primeiro! 🚀
                </div>
              ) : (
                dailyEntries.map((entry, index) => {
                  const isCurrentUser = currentUserId && entry.user.id === currentUserId;
                  const isExpanded = expandedId === entry.id;

                  let rankBadge = `#${index + 1}`;
                  if (index === 0) rankBadge = "🥇";
                  if (index === 1) rankBadge = "🥈";
                  if (index === 2) rankBadge = "🥉";

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

                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-white flex items-center gap-1.5">
                              {entry.user.globalName || entry.user.username}
                              {isCurrentUser && (
                                <span className="text-[10px] bg-[#5865f2] text-white px-1.5 py-0.2 rounded-full font-normal">
                                  Você
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-[#949ba4]">@{entry.user.username}</span>
                          </div>
                        </div>

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
          </>
        )}

        {/* CONTEÚDO DA ABA: RANKING GERAL DO SERVIDOR */}
        {activeTab === "SERVER" && (
          <div className="flex flex-col flex-1 overflow-hidden p-4">
            {/* Seletor de Filtro de Ordenação */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#949ba4] mr-1 flex items-center gap-1">
                <ArrowUpDown size={13} /> Ordenar por:
              </span>
              <button
                onClick={() => setSortBy("gamesWon")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === "gamesWon"
                    ? "bg-[#f0b232] text-black"
                    : "bg-[#2b2d31] text-[#949ba4] hover:text-white"
                }`}
              >
                <Trophy size={13} /> Vitórias
              </button>
              <button
                onClick={() => setSortBy("currentStreak")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === "currentStreak"
                    ? "bg-[#23a55a] text-white"
                    : "bg-[#2b2d31] text-[#949ba4] hover:text-white"
                }`}
              >
                <Flame size={13} /> Sequência
              </button>
              <button
                onClick={() => setSortBy("winRate")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === "winRate"
                    ? "bg-[#5865f2] text-white"
                    : "bg-[#2b2d31] text-[#949ba4] hover:text-white"
                }`}
              >
                <Percent size={13} /> % Vitórias
              </button>
              <button
                onClick={() => setSortBy("avgAttempts")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === "avgAttempts"
                    ? "bg-[#eb459e] text-white"
                    : "bg-[#2b2d31] text-[#949ba4] hover:text-white"
                }`}
              >
                <Target size={13} /> Média Chutes
              </button>
              <button
                onClick={() => setSortBy("gamesPlayed")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === "gamesPlayed"
                    ? "bg-[#4e5058] text-white"
                    : "bg-[#2b2d31] text-[#949ba4] hover:text-white"
                }`}
              >
                <Gamepad2 size={13} /> Jogos
              </button>
            </div>

            {/* Tabela de Estatísticas Acumuladas */}
            <div className="overflow-x-auto flex-1 border border-[#35363c] rounded-xl bg-[#2b2d31]/50">
              {loading && serverStats.length === 0 ? (
                <div className="text-center py-8 text-[#949ba4] text-sm animate-pulse">
                  Carregando o ranking do servidor...
                </div>
              ) : sortedServerStats.length === 0 ? (
                <div className="text-center py-8 text-[#949ba4] text-sm">
                  Nenhum registro acumulado encontrado neste servidor ainda.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#2b2d31] text-[#949ba4] font-bold border-b border-[#35363c] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Jogador</th>
                      <th className="py-2.5 px-2 text-center">Vitórias</th>
                      <th className="py-2.5 px-2 text-center">Streak</th>
                      <th className="py-2.5 px-2 text-center">% Vits</th>
                      <th className="py-2.5 px-2 text-center">Média</th>
                      <th className="py-2.5 px-2 text-center">Jogos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#35363c]/50">
                    {sortedServerStats.map((player, index) => {
                      const isCurrentUser = currentUserId && player.user.id === currentUserId;

                      let rankBadge = `#${index + 1}`;
                      if (index === 0) rankBadge = "🥇";
                      if (index === 1) rankBadge = "🥈";
                      if (index === 2) rankBadge = "🥉";

                      return (
                        <tr
                          key={player.user.id}
                          className={`transition-colors ${
                            isCurrentUser ? "bg-[#5865f2]/15 font-bold" : "hover:bg-[#35363c]/30"
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-[#949ba4] text-center w-8">
                            {rankBadge}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="relative group inline-block">
                              {player.user.avatarUrl ? (
                                <img
                                  src={player.user.avatarUrl}
                                  alt={player.user.username}
                                  className="w-10 h-10 rounded-full border-2 border-[#5865f2] object-cover flex-shrink-0 cursor-pointer shadow-md transition-transform transform group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#5865f2] border-2 border-[#5865f2] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 cursor-pointer shadow-md transition-transform transform group-hover:scale-110">
                                  <User size={18} />
                                </div>
                              )}

                              {/* Tooltip / Popup no Hover */}
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex flex-col bg-[#111214] text-white text-xs px-3 py-1.5 rounded-xl border border-[#35363c] shadow-2xl z-50 whitespace-nowrap pointer-events-none animate-fadeIn">
                                <span className="font-extrabold flex items-center gap-1">
                                  {player.user.globalName || player.user.username}
                                  {isCurrentUser && (
                                    <span className="text-[9px] bg-[#5865f2] text-white px-1.5 py-0.2 rounded-full font-normal">
                                      Você
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-[#949ba4]">@{player.user.username}</span>
                                {/* Triângulo indicador do popup */}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111214]"></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-black text-[#f0b232]">
                            {player.gamesWon}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#23a55a]">
                            🔥 {player.currentStreak}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#5865f2]">
                            {player.winRate}%
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#eb459e]">
                            {player.avgAttempts !== 99 ? player.avgAttempts : "-"}
                          </td>
                          <td className="py-2.5 px-2 text-center text-[#949ba4] font-semibold">
                            {player.gamesPlayed}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
