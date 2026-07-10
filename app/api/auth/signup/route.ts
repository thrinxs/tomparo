import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateSlug } from "@/app/api/recruiter/slug/check/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      accountType,
      companyName,
      companySize,
      industry,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (accountType === "recruiter" && !companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // ── Check existing email ──
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // ── Check existing phone ──
    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json(
          { error: "An account with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // ── Hash password ──
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Create user ──
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: "FREE",
      },
    });

    // ── If recruiter: create RecruiterProfile with auto-generated slug ──
    if (accountType === "recruiter") {
      // Generate base slug from company name
      let baseSlug = generateSlug(companyName);
      if (baseSlug.length < 3) baseSlug = "company";

      // Find a unique slug (add number suffix if taken)
      let slug = baseSlug;
      let suffix = 2;
      while (true) {
        const existing = await prisma.recruiterProfile.findFirst({
          where: { companySlug: slug },
        });
        if (!existing) break;
        slug = `${baseSlug}${suffix}`;
        suffix++;
      }

      await prisma.recruiterProfile.create({
        data: {
          userId: user.id,
          companyName,
          companySize: companySize || null,
          industry: industry || null,
          companySlug: slug,
          slugLocked: false,
        },
      });
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
