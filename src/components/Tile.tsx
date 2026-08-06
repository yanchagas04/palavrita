"use client";

import React from "react";
import { LetterStatus } from "@/lib/gameLogic";

interface TileProps {
  letter?: string;
  status?: LetterStatus;
  isCompleted?: boolean;
  positionIndex?: number;
  shake?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const Tile: React.FC<TileProps> = ({
  letter = "",
  status,
  isCompleted = false,
  positionIndex = 0,
  shake = false,
  isSelected = false,
  onClick,
}) => {
  let statusStyles = "border-[#3f4147] bg-transparent text-white";

  if (isCompleted && status) {
    if (status === "correct") {
      statusStyles = "bg-[#23a55a] border-[#23a55a] text-white";
    } else if (status === "present") {
      statusStyles = "bg-[#f0b232] border-[#f0b232] text-white";
    } else {
      statusStyles = "bg-[#4e5058] border-[#4e5058] text-white";
    }
  } else if (letter) {
    statusStyles = "border-[#80848e] bg-[#2b2d31] text-white animate-pop";
  }

  const selectedStyles = isSelected
    ? "border-[#5865f2] ring-2 ring-[#5865f2] shadow-[0_0_10px_rgba(88,101,242,0.5)] scale-105"
    : "";

  const animationDelay = isCompleted ? `${positionIndex * 150}ms` : "0ms";
  const flipClass = isCompleted ? "animate-flip" : "";
  const shakeClass = shake ? "animate-shake" : "";
  const cursorClass = onClick ? "cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`w-13 h-13 sm:w-14 sm:h-14 border-2 flex items-center justify-center text-2xl font-extrabold uppercase select-none rounded-md transition-all ${statusStyles} ${selectedStyles} ${flipClass} ${shakeClass} ${cursorClass}`}
      style={{ animationDelay }}
    >
      {letter}
    </div>
  );
};
