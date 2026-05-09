import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/config";
import { Audit } from "@/app/models/audit.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;

    const audit = await Audit.findOne({ auditId: resolvedParams.auditId }).lean();

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Strip private fields before returning public URL response
    const { email, companyName, role, ...publicData } = audit as any;

    return NextResponse.json({ success: true, audit: publicData });
  } catch (error) {
    console.error("[GET /api/audit/:id] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}