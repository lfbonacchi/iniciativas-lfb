import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 30) ?? "EMPTY",
    NODE_ENV: process.env.NODE_ENV,
  });
}
