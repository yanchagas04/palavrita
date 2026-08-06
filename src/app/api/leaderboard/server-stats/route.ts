import { NextResponse } from "next/server";
import { getServerPlayerStats } from "@/lib/server/leaderboardStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guildIdParam = searchParams.get("guildId") || "global";

    const playerStats = await getServerPlayerStats(guildIdParam);
    return NextResponse.json({ guildId: guildIdParam, playerStats });
  } catch (error) {
    console.error("Erro ao buscar estatísticas do servidor:", error);
    return NextResponse.json({ error: "Erro ao obter estatísticas do servidor" }, { status: 500 });
  }
}
