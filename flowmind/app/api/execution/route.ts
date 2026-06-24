import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/sop/[id]/executions
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const sop = await prisma.sop.findFirst({
    where: { id, userId: user.id },
    select: { id: true, dueDate: true },
  });
  if (!sop) {
    return NextResponse.json({ error: "SOP not found" }, { status: 404 });
  }

  if (sop.dueDate && new Date() > sop.dueDate) {
    await prisma.executionRun.updateMany({
      where: { sopId: sop.id, status: "in_progress" },
      data: { status: "overdue" },
    });
  }

  const runs = await prisma.executionRun.findMany({
    where: { sopId: id },
    orderBy: { updatedAt: "desc" },
  });

  const summary = {
    totalRuns: runs.length,
    completed: runs.filter((r) => r.status === "completed").length,
    inProgress: runs.filter((r) => r.status === "in_progress").length,
    overdue: runs.filter((r) => r.status === "overdue").length,
  };

  return NextResponse.json({ runs, summary });
}