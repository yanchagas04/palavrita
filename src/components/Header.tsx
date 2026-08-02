"use client";

import React from "react";
import { HelpCircle, BarChart2, RefreshCw, Trophy, User } from "lucide-react";
import { DiscordUser } from "@/hooks/useDiscord";

interface HeaderProps {
  dayNumber: number;
  user: DiscordUser | null;
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onResetDevWord?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dayNumber,
  user,
  onOpenHelp,
  onOpenStats,
  onOpenLeaderboard,
  onResetDevWord,
}) => {
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  return (
    <header className="w-full max-w-md flex items-center justify-between px-4 py-3 border-b border-[#35363c] bg-[#1e1f22]">
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenHelp}
          className="p-2 text-[#949ba4] hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors"
          title="Como Jogar"
        >
          <HelpCircle size={22} />
        </button>


        {isDev && onResetDevWord && (
          <button
            onClick={onResetDevWord}
            className="p-2 text-[#f0b232] hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
            title="Sortear Nova Palavra (Modo Dev)"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-2xl font-black tracking-wider text-white flex items-center gap-1.5 font-sans">
          PALAVRITA
          <span
            suppressHydrationWarning
            className="text-xs px-2 py-0.5 rounded-full bg-[#5865f2] text-white font-medium"
          >
            #{dayNumber}
          </span>
        </h1>
        {isDev && (
          <span className="text-[10px] text-[#f0b232] font-mono tracking-widest uppercase font-bold">
            ⚡ DEV MODE ⚡
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenStats}
          className="p-2 text-[#949ba4] hover:text-white hover:bg-[#2b2d31] rounded-lg transition-colors"
          title="Estatísticas Pessoais"
        >
          <BarChart2 size={22} />
        </button>

        {/* Perfil do Jogador Logado */}
        {user && (
          <div
            className="flex items-center gap-1.5 bg-[#2b2d31] pl-1.5 pr-2 py-1 rounded-full border border-[#35363c]"
            title={`Jogando como: ${user.globalName || user.username}`}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#5865f2] text-white flex items-center justify-center text-[10px] font-bold">
                <User size={12} />
              </div>
            )}
            <span className="text-xs max-w-[70px] truncate text-[#dbdee1] font-medium">
              {user.globalName || user.username}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
