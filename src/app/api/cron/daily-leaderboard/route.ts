import { NextResponse } from "next/server";
import { getTodayDateString } from "@/lib/dailyWord";
import { processDailyNotification } from "@/lib/server/notifyUtils";
import { isNotificationPosted } from "@/lib/server/leaderboardStore";

// Este endpoint é chamado pelo Vercel Cron Jobs às 02:59 UTC (23:59 BRT)
// Protegido com CRON_SECRET para evitar chamadas não autorizadas
export async function GET(request: Request) {
  // Valida o secret do cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const today = getTodayDateString();

  // Evita enviar duplicado se já foi postado hoje
  if (isNotificationPosted(today)) {
    return NextResponse.json({
      success: true,
      message: "Placar já enviado hoje.",
      dateString: today,
    });
  }

  const result = await processDailyNotification(today);

  return NextResponse.json({
    dateString: today,
    ...result,
  });
}
