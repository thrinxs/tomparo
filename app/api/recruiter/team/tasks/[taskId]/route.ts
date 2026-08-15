import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function getProfile(userId: string) {
  let profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (profile) return profile;
  const m = await prisma.recruiterTeamMember.findFirst({ where: { userId }, include: { recruiter: true } });
  return m?.recruiter || null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const task = await prisma.teamTask.findFirst({ where: { id: taskId, recruiterId: profile.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const body = await req.json();
    const data: Prisma.TeamTaskUpdateInput = {};

    // Assignee can only update status
    // Admin/Owner can update everything
    if (body.status) data.status = body.status;
    if (body.title) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.priority) data.priority = body.priority;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const updated = await prisma.teamTask.update({
      where: { id: taskId },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, image: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        comments: { include: { author: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: "asc" } },
      },
    });

    // Notify assignee if status changed by someone else
    if (body.status && task.assignedToId !== userId) {
      await prisma.teamNotification.create({
        data: {
          userId: task.assignedToId,
          recruiterId: profile.id,
          type: "TASK_UPDATED",
          title: `Task updated: ${task.title}`,
          body: `Status changed to ${body.status}`,
          link: "/recruiter/team/tasks",
        },
      });
    }

    return NextResponse.json({ task: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.teamTask.deleteMany({ where: { id: taskId, recruiterId: profile.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
