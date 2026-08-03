import { getAllLeaderboardsForDate, LeaderboardEntry, markNotificationPosted } from "@/lib/server/leaderboardStore";
import { getDailyWord } from "@/lib/dailyWord";

function buildLeaderboardEmbed(dayNumber: number, wordDisplay: string, entries: LeaderboardEntry[]) {
  const sorted = [...entries].sort((a, b) => {
    if (a.gameStatus === "WON" && b.gameStatus !== "WON") return -1;
    if (a.gameStatus !== "WON" && b.gameStatus === "WON") return 1;
    if (a.gameStatus === "WON" && b.gameStatus === "WON" && a.attempts !== b.attempts)
      return a.attempts - b.attempts;
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });

  const fields = sorted.slice(0, 10).map((entry, index) => {
    const badge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
    const name = entry.user.globalName || entry.user.username;
    const statusText =
      entry.gameStatus === "WON" ? `Vitória em ${entry.attempts}/6 🎯` : "Derrota ❌";
    return { name: `${badge} ${name}`, value: statusText, inline: true };
  });

  return {
    title: `🏆 Placar do Dia #${dayNumber} — Palavrita`,
    description: `A palavra de hoje foi **${wordDisplay.toUpperCase()}**!\n\nConfira os resultados de quem jogou hoje:`,
    color: 0x5865f2,
    fields:
      fields.length > 0
        ? fields
        : [{ name: "Palavrita", value: "Nenhuma partida registrada hoje. 😔", inline: false }],
    footer: { text: "Palavrita • Jogo diário de palavras em PT-BR" },
    timestamp: new Date().toISOString(),
  };
}

async function postToChannel(botToken: string, channelId: string, embed: object): Promise<boolean> {
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (res.ok) return true;
    const errText = await res.text();
    console.error(`Erro ao postar no canal ${channelId}:`, errText);
    return false;
  } catch (e) {
    console.error(`Erro de rede ao postar no canal ${channelId}:`, e);
    return false;
  }
}

export async function processDailyNotification(dateParam: string): Promise<{
  success: boolean;
  error?: string;
  results: Array<{ channel: string; status: string }>;
}> {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      success: false,
      error: "DISCORD_BOT_TOKEN não configurado.",
      results: [],
    };
  }

  const dailyInfo = getDailyWord(dateParam);
  const allGuildLeaderboards = await getAllLeaderboardsForDate(dateParam);
  const results: Array<{ channel: string; status: string }> = [];

  // Coleta os canais únicos onde a Activity foi jogada hoje
  // channelId é o canal de voz capturado pelo Discord SDK automaticamente
  const channelsPosted = new Set<string>();

  for (const [guildId, entries] of Object.entries(allGuildLeaderboards)) {
    if (guildId === "global" || entries.length === 0) continue;

    // Pega o canal de voz onde a Activity estava rodando neste servidor
    const targetChannelId = entries.find((e) => e.channelId)?.channelId;
    if (!targetChannelId || channelsPosted.has(targetChannelId)) continue;

    const embed = buildLeaderboardEmbed(
      dailyInfo.dayNumber,
      dailyInfo.wordEntry.display,
      entries
    );

    const ok = await postToChannel(botToken, targetChannelId, embed);
    channelsPosted.add(targetChannelId);
    results.push({
      channel: `guild:${guildId} → canal:${targetChannelId}`,
      status: ok ? "SUCCESS" : "FAILED",
    });
  }

  if (results.length === 0) {
    return {
      success: false,
      error: "Nenhum jogo registrado hoje com canal identificado. O placar é postado automaticamente quando alguém joga a Activity dentro de um canal de voz no Discord.",
      results: [],
    };
  }

  const anySuccess = results.some((r) => r.status === "SUCCESS");
  if (anySuccess) await markNotificationPosted(dateParam);

  return { success: true, results };
}
