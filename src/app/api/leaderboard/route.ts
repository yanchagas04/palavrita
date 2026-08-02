import { NextResponse } from "next/server";
import {
  getTodayLeaderboard,
  addOrUpdateLeaderboardEntry,
  isNotificationPosted,
} from "@/lib/server/leaderboardStore";
import { getTodayDateString } from "@/lib/dailyWord";
import { processDailyNotification } from "./notify/route";

function checkAndTriggerAutoNotification() {
  try {
    const today = getTodayDateString();
    // Calcula a data de ontem (YYYY-MM-DD)
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    // Se ontem teve jogos e a notificação ainda não foi enviada, envia automaticamente agora!
    if (!isNotificationPosted(yesterdayStr)) {
      processDailyNotification(yesterdayStr).catch((err) =>
        console.error("Erro no envio automático em segundo plano do placar de ontem:", err)
      );
    }
  } catch (e) {
    console.error("Erro ao checar notificação automática:", e);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || getTodayDateString();
    const guildIdParam = searchParams.get("guildId") || "global";

    // Checagem automática em segundo plano
    checkAndTriggerAutoNotification();

    const leaderboard = getTodayLeaderboard(dateParam, guildIdParam);
    return NextResponse.json({ dateString: dateParam, guildId: guildIdParam, leaderboard });
  } catch (error) {
    console.error("Erro ao buscar leaderboard:", error);
    return NextResponse.json({ error: "Erro ao obter o leaderboard" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, dateString, guesses, gameStatus, guildId, channelId } = body;

    if (!user || !user.id || !dateString || !Array.isArray(guesses) || !gameStatus) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para submissão do jogo" },
        { status: 400 }
      );
    }

    const updatedLeaderboard = addOrUpdateLeaderboardEntry({
      user: {
        id: user.id,
        username: user.username || "Jogador",
        globalName: user.globalName,
        avatarUrl: user.avatarUrl,
      },
      dateString,
      guesses,
      gameStatus,
      attempts: guesses.length,
      guildId: guildId || "global",
      channelId: channelId || undefined,
    });

    // Checagem automática em segundo plano
    checkAndTriggerAutoNotification();

    return NextResponse.json({
      success: true,
      leaderboard: updatedLeaderboard,
    });
  } catch (error) {
    console.error("Erro ao salvar submissão do leaderboard:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
