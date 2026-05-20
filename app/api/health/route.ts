// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const envCheck = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "not set",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "not set",
  };

  const allConfigured = envCheck.MONGODB_URI && envCheck.GEMINI_API_KEY && envCheck.RESEND_API_KEY;

  return NextResponse.json({
    status: allConfigured ? "healthy" : "missing configuration",
    environment: envCheck,
    message: allConfigured 
      ? "All required environment variables are set" 
      : "Some environment variables are missing. Check .env.local file.",
    hint: !envCheck.MONGODB_URI 
      ? "MONGODB_URI is required. See SETUP_INSTRUCTIONS.md" 
      : undefined
  }, { 
    status: allConfigured ? 200 : 500 
  });
}
