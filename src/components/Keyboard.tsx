"use client";

import React from "react";
import { Delete } from "lucide-react";
import { LetterStatus } from "@/lib/gameLogic";

interface KeyboardProps {
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  letterStatuses: Record<string, LetterStatus>;
  disabled?: boolean;
}

const KEYS_ROW1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const KEYS_ROW2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const KEYS_ROW3 = ["Z", "X", "C", "V", "B", "N", "M"];

export const Keyboard: React.FC<KeyboardProps> = ({
  onChar,
  onDelete,
  onEnter,
  letterStatuses,
  disabled = false,
}) => {
  const getKeyStyle = (char: string) => {
    const status = letterStatuses[char];
    if (status === "correct") return "bg-[#23a55a] text-white";
    if (status === "present") return "bg-[#f0b232] text-white";
    if (status === "absent") return "bg-[#2b2d31] text-[#6d6f78]";
    return "bg-[#4e5058] text-white hover:bg-[#6d6f78]";
  };

  return (
    <div className="w-full max-w-md px-1.5 pb-8 sm:pb-6 flex flex-col gap-1.5 select-none">
      {/* Linha 1 */}
      <div className="flex justify-center gap-1">
        {KEYS_ROW1.map((char) => (
          <button
            key={char}
            onClick={() => !disabled && onChar(char)}
            disabled={disabled}
            className={`flex-1 h-13 rounded-md font-bold text-sm sm:text-base flex items-center justify-center transition-colors active:scale-95 ${getKeyStyle(
              char
            )}`}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Linha 2 */}
      <div className="flex justify-center gap-1 px-3">
        {KEYS_ROW2.map((char) => (
          <button
            key={char}
            onClick={() => !disabled && onChar(char)}
            disabled={disabled}
            className={`flex-1 h-13 rounded-md font-bold text-sm sm:text-base flex items-center justify-center transition-colors active:scale-95 ${getKeyStyle(
              char
            )}`}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Linha 3 */}
      <div className="flex justify-center gap-1">
        <button
          onClick={() => !disabled && onEnter()}
          disabled={disabled}
          className="px-2 sm:px-3 h-13 rounded-md font-bold text-xs sm:text-sm bg-[#5865f2] text-white hover:bg-[#4752c4] active:scale-95 transition-colors flex items-center justify-center"
        >
          ENTER
        </button>

        {KEYS_ROW3.map((char) => (
          <button
            key={char}
            onClick={() => !disabled && onChar(char)}
            disabled={disabled}
            className={`flex-1 h-13 rounded-md font-bold text-sm sm:text-base flex items-center justify-center transition-colors active:scale-95 ${getKeyStyle(
              char
            )}`}
          >
            {char}
          </button>
        ))}

        <button
          onClick={() => !disabled && onDelete()}
          disabled={disabled}
          className="px-2.5 sm:px-3.5 h-13 rounded-md font-bold bg-[#4e5058] text-white hover:bg-[#6d6f78] active:scale-95 transition-colors flex items-center justify-center"
          title="Apagar"
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
};
