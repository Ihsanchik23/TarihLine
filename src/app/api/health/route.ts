import { NextResponse } from "next/server";
import { getFoundationStatus } from "@/lib/supabase/health";

export async function GET() {
  const status = await getFoundationStatus();

  return NextResponse.json(status, {
    status: status.connected ? 200 : 503,
  });
}
