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

async function postToChannel(botToken: string, channelId: string, embed: object): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (res.ok) return { success: true };
    const errText = await res.text();
    console.error(`Erro ao postar no chat do canal ${channelId}:`, errText);
    return { success: false, error: errText };
  } catch (e: any) {
    console.error(`Erro de rede ao postar no chat do canal ${channelId}:`, e);
    return { success: false, error: e?.message || "Erro de rede" };
  }
}

export async function processDailyNotification(dateParam: string): Promise<{
  success: boolean;
  error?: string;
  results: Array<{ channel: string; status: string; error?: string }>;
}> {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      success: false,
      error: "DISCORD_BOT_TOKEN não está configurado nas variáveis de ambiente.",
      results: [],
    };
  }

  const dailyInfo = getDailyWord(dateParam);
  const allGuildLeaderboards = await getAllLeaderboardsForDate(dateParam);
  const results: Array<{ channel: string; status: string; error?: string }> = [];

  // Mapeia os chats únicos das partidas
  const channelToEntriesMap = new Map<string, LeaderboardEntry[]>();

  for (const [guildId, entries] of Object.entries(allGuildLeaderboards)) {
    for (const entry of entries) {
      if (entry.channelId) {
        if (!channelToEntriesMap.has(entry.channelId)) {
          channelToEntriesMap.set(entry.channelId, []);
        }
        channelToEntriesMap.get(entry.channelId)!.push(entry);
      }
    }
  }

  // Envia a mensagem do placar para cada chat onde a Activity foi iniciada
  for (const [channelId, entries] of channelToEntriesMap.entries()) {
    const embed = buildLeaderboardEmbed(dailyInfo.dayNumber, dailyInfo.wordEntry.display, entries);
    const res = await postToChannel(botToken, channelId, embed);
    results.push({
      channel: channelId,
      status: res.success ? "SUCCESS" : "FAILED",
      error: res.error,
    });
  }

  if (results.length === 0) {
    return {
      success: false,
      error: "Nenhuma partida registrada hoje com canal/chat identificado.",
      results: [],
    };
  }

  const anySuccess = results.some((r) => r.status === "SUCCESS");
  if (anySuccess) {
    await markNotificationPosted(dateParam);
  }

  return { success: anySuccess, results };
}
