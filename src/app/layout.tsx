import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Palavrita - Wordle em Português para Discord",
  description: "Jogo diário de palavras em Português do Brasil como Discord Activity.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
