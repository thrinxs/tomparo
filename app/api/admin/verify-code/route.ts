import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Must be logged in first
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Must be ADMIN role
    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { code } = await req.json();

    if (!code || code !== process.env.ADMIN_ACCESS_CODE) {
      return NextResponse.json({ error: "Invalid admin code" }, { status: 403 });
    }

    // Set a secure httpOnly cookie marking admin code as verified
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Admin verify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
