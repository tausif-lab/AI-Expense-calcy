// app/api/admin/trigger-price-check/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  try {
    // Call the detect-changes endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/detect-changes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("[POST /api/admin/trigger-price-check] Non-JSON response:", text.substring(0, 200));
      return NextResponse.json(
        { 
          error: "detect-changes endpoint returned an error", 
          details: "Check server logs for details. Likely a database connection issue.",
          hint: "Make sure MONGODB_URI is set in .env.local"
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to trigger price check", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Price check triggered successfully",
        affectedUsers: data.affectedUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/admin/trigger-price-check]", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      hint: "Check that .env.local exists with MONGODB_URI set"
    }, { status: 500 });
  }
}
