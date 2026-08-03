import { NextResponse } from "next/server";
import { getTodayDateString } from "@/lib/dailyWord";
import { processDailyNotification } from "@/lib/server/notifyUtils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || getTodayDateString();

  const result = await processDailyNotification(dateParam);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || getTodayDateString();

  const result = await processDailyNotification(dateParam);
  return NextResponse.json(result);
}
