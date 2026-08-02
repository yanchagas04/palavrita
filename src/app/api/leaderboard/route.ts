import { NextResponse } from "next/server";
import {
  getTodayLeaderboard,
  addOrUpdateLeaderboardEntry,
} from "@/lib/server/leaderboardStore";
import { getTodayDateString } from "@/lib/dailyWord";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || getTodayDateString();
    const guildIdParam = searchParams.get("guildId") || "global";

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

    return NextResponse.json({
      success: true,
      leaderboard: updatedLeaderboard,
    });
  } catch (error) {
    console.error("Erro ao salvar submissão do leaderboard:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
