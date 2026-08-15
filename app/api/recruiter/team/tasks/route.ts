import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, FROM } from "@/lib/email";

async function getProfile(userId: string) {
  let profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (profile) return { profile, isOwner: true };
  const m = await prisma.recruiterTeamMember.findFirst({ where: { userId }, include: { recruiter: true } });
  return m ? { profile: m.recruiter, isOwner: false, role: m.role } : { profile: null, isOwner: false };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const { profile } = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const tasks = await prisma.teamTask.findMany({
      where: { recruiterId: profile.id },
      include: {
        assignedTo: { select: { id: true, name: true, image: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const { profile, isOwner, role } = await getProfile(userId) as any;
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only Owner/Admin can create tasks
    if (!isOwner && role === "MEMBER") {
      return NextResponse.json({ error: "Only Admins can create tasks" }, { status: 403 });
    }

    const { title, description, priority, assignedToId, dueDate, candidateId } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Task title required" }, { status: 400 });
    if (!assignedToId) return NextResponse.json({ error: "Assignee required" }, { status: 400 });

    const task = await prisma.teamTask.create({
      data: {
        recruiterId: profile.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "MEDIUM",
        status: "TODO",
        assignedToId,
        createdById: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        candidateId: candidateId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        comments: { include: { author: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: "asc" } },
      },
    });

    // Create notification for assignee
    await prisma.teamNotification.create({
      data: {
        userId: assignedToId,
        recruiterId: profile.id,
        type: "TASK_ASSIGNED",
        title: "New task assigned to you",
        body: title.trim(),
        link: "/recruiter/team/tasks",
      },
    });

    // Send email to assignee
    try {
      const assignee = await prisma.user.findUnique({ where: { id: assignedToId }, select: { email: true, name: true } });
      const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      if (assignee?.email) {
        await sendEmail({
          to: assignee.email,
          from: FROM.hire,
          subject: `New task assigned: ${title.trim()}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
              <h2 style="color:#7c3aed;">New Task Assigned</h2>
              <p>Hi ${assignee.name || "there"},</p>
              <p><strong>${creator?.name || "Your team"}</strong> has assigned you a new task on TomParo.</p>
              <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
                <p style="font-weight:600;font-size:16px;margin:0 0 8px;">${title.trim()}</p>
                ${description ? `<p style="color:#6b7280;margin:0 0 8px;">${description}</p>` : ""}
                <p style="color:#6b7280;margin:0;">Priority: <strong>${priority || "MEDIUM"}</strong>${dueDate ? ` · Due: <strong>${new Date(dueDate).toLocaleDateString()}</strong>` : ""}</p>
              </div>
              <a href="${process.env.NEXTAUTH_URL}/recruiter/team/tasks" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
                View Task
              </a>
            </div>
          `,
        });
      }
    } catch { /* Silently fail */ }

    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
