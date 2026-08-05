import { NextResponse } from "next/server";
import { getTodayDateString } from "@/lib/dailyWord";
import { processDailyNotification } from "@/lib/server/notifyUtils";
import { isNotificationPosted } from "@/lib/server/leaderboardStore";

export const dynamic = "force-dynamic";

// Calcula a data de ontem no fuso de Brasília (YYYY-MM-DD)
function getYesterdayDateString(): string {
  const now = new Date();
  const brt = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  brt.setDate(brt.getDate() - 1);
  const year = brt.getFullYear();
  const month = String(brt.getMonth() + 1).padStart(2, "0");
  const day = String(brt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  // Valida o secret do cron se estiver configurado na Vercel
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // 1. Tenta enviar o de ontem primeiro (caso o cron rode após 00:00 com a janela de 1h do plano Hobby)
  if (!(await isNotificationPosted(yesterday))) {
    const resYesterday = await processDailyNotification(yesterday);
    if (resYesterday.success) {
      return NextResponse.json({ targetDate: yesterday, ...resYesterday });
    }
  }

  // 2. Se o de ontem já foi enviado ou não tinha partidas, tenta o de hoje
  if (!(await isNotificationPosted(today))) {
    const resToday = await processDailyNotification(today);
    return NextResponse.json({ targetDate: today, ...resToday });
  }

  return NextResponse.json({
    success: true,
    message: "Placares já enviados.",
    today,
    yesterday,
  });
}
