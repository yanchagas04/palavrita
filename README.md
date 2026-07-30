<div align="center">
  <h1>🎮 Palavrita</h1>
  <p><strong>Discord Activity estilo Wordle / Termo em Português do Brasil (PT-BR)</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Discord_SDK-Activity-5865F2?style=for-the-badge&logo=discord" alt="Discord Embedded App SDK" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  </p>
</div>

---

## 📌 Sobre o Projeto

O **Palavrita** é uma aplicação web desenvolvida em **Next.js 15** e **TypeScript**, projetada para rodar nativamente como uma **Discord Activity** (Embedded App) dentro de canais de voz do Discord.

O jogo é inspirado no clássico *Wordle* e *Termo.ooo*, trazendo o desafio de adivinhar uma palavra secreta de 5 letras em até 6 tentativas, utilizando um dicionário enriquecido em **Português do Brasil**.

---

## ✨ Funcionalidades

- 📅 **Palavra Diária Determinística**: Todos os jogadores em qualquer canal de voz jogam a mesma palavra no mesmo dia (fuso horário `UTC-3 / Brasília`).
- 📚 **Dicionário em Português BR Completo**:
  - **+13.000 Chutes Válidos**: Baseado no corpus linguístico oficial `fserb/pt-br`, aceitando formas plurais, conjugações verbais comuns (`CHUTA`, `TESTE`, `FALA`, `ANDA`, `CORRE`) e variações regionais.
  - **~1.500 Palavras Secretas Curadas**: Seleção das palavras mais populares do dia a dia para garantir partidas divertidas e sem termos obscuros ou arcaicos como resposta.
  - **Normalização Automática**: Aceita digitação sem acento e revela a palavra final com sua devida acentuação gráfica (`ÂMAGO`, `ÉTICA`, `TÊNIS`).
- 📊 **Placar & Estatísticas**:
  - Acompanhamento de total de jogos, % de vitórias, sequência atual (*streak*), melhor sequência e gráfico de distribuição de tentativas.
  - Salva o progresso diário automaticamente no `LocalStorage`.
- 🎨 **Interface Nativa Discord Dark Theme**:
  - Design visual ajustado para paleta de cores oficial do Discord (`#1e1f22`, `#2b2d31`, `#23a55a`, `#f0b232`).
  - Animações fluidas de digitação (*pop*), revelação de letras (*flip*), vitória (*confete*) e aviso de palavra inválida (*shake*).
  - Suporte completo a **Teclado Virtual** na tela e **Teclado Físico** (`A-Z`, `Enter`, `Backspace`).
- ⚡ **Modo de Desenvolvimento (`DEV_MODE`)**:
  - Permite gerar novas palavras aleatórias instantaneamente a cada `F5` ou através do botão de reset 🔄 no cabeçalho.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Biblioteca**: [React 19](https://react.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Integração Discord**: [`@discord/embedded-app-sdk`](https://www.npmjs.com/package/@discord/embedded-app-sdk)
- **Efeitos e Ícones**: `canvas-confetti` & `lucide-react`
