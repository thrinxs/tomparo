import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const isPremium = (session.user as any).isPremium;
    const { id: portfolioId } = await params;

    const portfolio = await prisma.portfolio.findFirst({ where: { id: portfolioId, userId } });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Free plan: max 10 projects
    if (!isPremium) {
      const count = await prisma.portfolioProject.count({ where: { portfolioId } });
      if (count >= 10) {
        return NextResponse.json(
          { error: "Free plan is limited to 10 projects per portfolio. Upgrade to Premium for unlimited." },
          { status: 403 }
        );
      }
    }

    const { title, description, coverImage, videoUrl, videoType, liveUrl, repoUrl, tags, mediaFiles } = await req.json();

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const count = await prisma.portfolioProject.count({ where: { portfolioId } });

    const project = await prisma.portfolioProject.create({
      data: {
        portfolioId,
        title,
        description: description || "",
        coverImage: coverImage || "",
        videoUrl: videoUrl || "",
        videoType: videoType || "",
        liveUrl: liveUrl || "",
        repoUrl: repoUrl || "",
        tags: tags ? JSON.stringify(tags) : null,
        mediaFiles: mediaFiles ? JSON.stringify(mediaFiles) : null,
        order: count,
      },
    });

    return NextResponse.json(project);
  } catch (err) {
    console.error("[PROJECT_POST]", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
