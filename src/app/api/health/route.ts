import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env
  checks.apiKey = process.env.GEMINI_API_KEY ? "set" : "missing";

  // Check imports
  try {
    await import("@google/genai");
    checks.genai = "ok";
  } catch (e) {
    checks.genai = String(e);
  }

  try {
    await import("pdf-parse");
    checks.pdfParse = "ok";
  } catch (e) {
    checks.pdfParse = String(e);
  }

  return NextResponse.json({ ok: true, checks });
}
