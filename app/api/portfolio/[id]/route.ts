import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id } = await params;

    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
      include: { projects: { orderBy: { order: "asc" } } },
    });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("[PORTFOLIO_GET_ID]", err);
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const isPremium = (session.user as any).isPremium;
    const { id } = await params;

    const portfolio = await prisma.portfolio.findFirst({ where: { id, userId } });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    // Only premium can go on discovery or use non-default templates
    if (!isPremium) {
      body.onDiscovery = false;
      body.template = "default";
      body.customStyle = null;
    }

    // If setting as default, unset all others first
    if (body.isDefault) {
      await prisma.portfolio.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Slug uniqueness check
    if (body.slug && body.slug !== portfolio.slug) {
      const existing = await prisma.portfolio.findUnique({ where: { slug: body.slug } });
      if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 400 });
      body.slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    }

    const updated = await prisma.portfolio.update({
      where: { id },
      data: body,
      include: { projects: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PORTFOLIO_PUT]", err);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id } = await params;

    const portfolio = await prisma.portfolio.findFirst({ where: { id, userId } });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.portfolio.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PORTFOLIO_DELETE]", err);
    return NextResponse.json({ error: "Failed to delete portfolio" }, { status: 500 });
  }
}
