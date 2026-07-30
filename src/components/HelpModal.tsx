"use client";

import React from "react";
import { X, HelpCircle } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1e1f22] border border-[#35363c] rounded-2xl p-6 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#949ba4] hover:text-white p-1 rounded-lg hover:bg-[#2b2d31] transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <HelpCircle size={22} className="text-[#5865f2]" />
          Como Jogar
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-[#dbdee1] leading-relaxed">
          <p>
            Adivinhe a palavra secreta de <strong>5 letras</strong> em <strong>6 tentativas</strong>.
          </p>
          <p>
            Cada tentativa deve ser uma palavra válida de 5 letras em português. A cada chute, a cor das letras muda para mostrar o quão perto você está.
          </p>

          <hr className="border-[#35363c] my-2" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#23a55a] font-black text-white flex items-center justify-center text-sm">
                T
              </div>
              <p>A letra <strong>T</strong> faz parte da palavra e está na posição correta.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#f0b232] font-black text-white flex items-center justify-center text-sm">
                E
              </div>
              <p>A letra <strong>E</strong> faz parte da palavra, mas em outra posição.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#4e5058] font-black text-white flex items-center justify-center text-sm">
                R
              </div>
              <p>A letra <strong>R</strong> não faz parte da palavra.</p>
            </div>
          </div>

          <hr className="border-[#35363c] my-2" />

          <p className="text-center font-semibold text-[#f0b232]">
            Uma nova palavra fica disponível a cada dia!
          </p>
        </div>
      </div>
    </div>
  );
};
