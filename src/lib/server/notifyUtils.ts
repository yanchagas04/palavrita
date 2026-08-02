import {
  getAllLeaderboardsForDate,
  getTodayLeaderboard,
  markNotificationPosted,
} from "@/lib/server/leaderboardStore";
import { getDailyWord } from "@/lib/dailyWord";

export async function processDailyNotification(dateParam: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!webhookUrl && !botToken) {
    return {
      success: false,
      error: "Nenhum DISCORD_WEBHOOK_URL ou DISCORD_BOT_TOKEN configurado",
    };
  }

  const dailyInfo = getDailyWord(dateParam);
  const resultsSent: Array<{ target: string; status: string }> = [];

  // Envio via WEBHOOK
  if (webhookUrl) {
    const entries = getTodayLeaderboard(dateParam, "global");
    const top5 = entries.slice(0, 5);
    const fields = top5.map((entry, index) => {
      const badge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
      const name = entry.user.globalName || entry.user.username;
      const statusText =
        entry.gameStatus === "WON" ? `Vitória em ${entry.attempts}/6 🎯` : "Derrota (X/6) ❌";
      return { name: `${badge} ${name}`, value: statusText, inline: true };
    });

    const payload = {
      username: "Palavrita Placar",
      embeds: [
        {
          title: `🏆 Placar do Dia #${dailyInfo.dayNumber} - Palavrita`,
          description: `A palavra secreta de hoje foi **${dailyInfo.wordEntry.display.toUpperCase()}**!\nConfira o resultado final:`,
          color: 0x5865f2,
          fields:
            fields.length > 0
              ? fields
              : [{ name: "Palavrita", value: "Nenhuma partida registrada hoje.", inline: false }],
          footer: { text: "Palavrita • O jogo diário de palavras!" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (webhookRes.ok || webhookRes.status === 204) {
        resultsSent.push({ target: "WEBHOOK", status: "SUCCESS" });
        markNotificationPosted(dateParam);
      } else {
        const errText = await webhookRes.text();
        resultsSent.push({ target: "WEBHOOK", status: `FAILED: ${errText}` });
      }
    } catch (e) {
      console.error("Erro ao enviar Webhook:", e);
    }
  }

  // Envio via BOT TOKEN (múltiplos servidores)
  if (botToken) {
    const allGuildLeaderboards = getAllLeaderboardsForDate(dateParam);
    for (const [guildId, entries] of Object.entries(allGuildLeaderboards)) {
      if (guildId === "global" || entries.length === 0) continue;

      const targetChannelId = entries.find((e) => e.channelId)?.channelId;
      if (!targetChannelId) continue;

      const sorted = [...entries].sort((a, b) => {
        if (a.gameStatus === "WON" && b.gameStatus !== "WON") return -1;
        if (a.gameStatus !== "WON" && b.gameStatus === "WON") return 1;
        if (a.gameStatus === "WON" && b.gameStatus === "WON" && a.attempts !== b.attempts)
          return a.attempts - b.attempts;
        return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      });

      const fields = sorted.slice(0, 5).map((entry, index) => {
        const badge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
        const name = entry.user.globalName || entry.user.username;
        const statusText =
          entry.gameStatus === "WON" ? `Vitória em ${entry.attempts}/6 🎯` : "Derrota (X/6) ❌";
        return { name: `${badge} ${name}`, value: statusText, inline: true };
      });

      try {
        const botRes = await fetch(
          `https://discord.com/api/v10/channels/${targetChannelId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embeds: [
                {
                  title: `🏆 Placar do Dia #${dailyInfo.dayNumber} - Palavrita`,
                  description: `A palavra de hoje foi **${dailyInfo.wordEntry.display.toUpperCase()}**!`,
                  color: 0x5865f2,
                  fields: fields.length > 0 ? fields : [{ name: "Servidor", value: "Sem partidas hoje." }],
                  footer: { text: "Palavrita • O jogo diário de palavras" },
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          }
        );

        if (botRes.ok) {
          resultsSent.push({ target: `BOT_GUILD_${guildId}`, status: "SUCCESS" });
          markNotificationPosted(dateParam);
        } else {
          const errText = await botRes.text();
          resultsSent.push({ target: `BOT_GUILD_${guildId}`, status: `FAILED: ${errText}` });
        }
      } catch (e) {
        console.error(`Erro ao postar bot no canal ${targetChannelId}:`, e);
      }
    }
  }

  return { success: true, dateString: dateParam, resultsSent };
}
