import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PortfolioPublicClient from "@/components/portfolio/PortfolioPublicClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    include: { user: { select: { name: true } } },
  });
  if (!portfolio) return { title: "Portfolio not found" };
  return {
    title: `${portfolio.title} — ${portfolio.user.name} | TomParo`,
    description: portfolio.tagline || `${portfolio.user.name}'s portfolio on TomParo`,
  };
}

export default async function PortfolioPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
      projects: { orderBy: { order: "asc" } },
      _count: { select: { likes: true } },
    },
  });

  if (!portfolio) notFound();
  if (portfolio.visibility === "PRIVATE") notFound();

  const serialized = {
    ...portfolio,
    projects: portfolio.projects.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      mediaFiles: p.mediaFiles ? JSON.parse(p.mediaFiles) : [],
    })),
    likesCount: portfolio._count.likes,
  };

  return <PortfolioPublicClient portfolio={serialized} />;
}
