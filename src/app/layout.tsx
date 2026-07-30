import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Palavrita - Wordle em Português para Discord",
  description: "Jogo diário de palavras em Português do Brasil como Discord Activity.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-[#1e1f22] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
