import { NextResponse } from "next/server";
import { getUserGameEntry } from "@/lib/server/leaderboardStore";
import { getTodayDateString } from "@/lib/dailyWord";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const dateParam = searchParams.get("date") || getTodayDateString();
    const guildIdParam = searchParams.get("guildId") || "global";

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const entry = await getUserGameEntry(userId, dateParam, guildIdParam);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Erro ao buscar progresso do usuário:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
