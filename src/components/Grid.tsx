"use client";

import React from "react";
import { Tile } from "./Tile";
import { evaluateGuess } from "@/lib/gameLogic";

interface GridProps {
  guesses: string[];
  currentGuess: string;
  solution: string;
  isShakeRow?: boolean;
}

export const Grid: React.FC<GridProps> = ({
  guesses,
  currentGuess,
  solution,
  isShakeRow = false,
}) => {
  const empties = 6 - guesses.length - 1;

  return (
    <div className="grid grid-rows-6 gap-1.5 p-2 my-auto">
      {/* Linhas anteriores concluídas */}
      {guesses.map((guess, rowIndex) => {
        const statuses = evaluateGuess(guess, solution);
        return (
          <div key={rowIndex} className="grid grid-cols-5 gap-1.5">
            {guess.split("").map((letter, posIndex) => (
              <Tile
                key={posIndex}
                letter={letter}
                status={statuses[posIndex]}
                isCompleted={true}
                positionIndex={posIndex}
              />
            ))}
          </div>
        );
      })}

      {/* Linha atual em digitação (se ainda não estourou 6 tentativas) */}
      {guesses.length < 6 && (
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const letter = currentGuess[i] || "";
            return <Tile key={i} letter={letter} shake={isShakeRow} />;
          })}
        </div>
      )}

      {/* Linhas vazias futuras */}
      {Array.from({ length: Math.max(0, empties) }).map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }).map((_, j) => (
            <Tile key={j} />
          ))}
        </div>
      ))}
    </div>
  );
};
