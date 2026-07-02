import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const sop = await prisma.sop.findFirst({
    where: { id, userId: user.id },
    include: {
      steps: {
        include: { checklistItems: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!sop) return NextResponse.json({ error: "SOP not found" }, { status: 404 });

  const runs = await prisma.executionRun.findMany({
    where: { sopId: id },
    include: {
      stepLogs: {
        include: { checklistItem: { include: { step: true } } },
        orderBy: { toggledAt: "asc" },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  // ─── Aggregate stats ───
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === "completed").length;
  const inProgressRuns = runs.filter((r) => r.status === "in_progress").length;
  const overdueRuns = runs.filter((r) => r.status === "overdue").length;

  const completionTimes = runs
    .filter((r) => r.completedAt)
    .map((r) => (new Date(r.completedAt!).getTime() - new Date(r.startedAt).getTime()) / 60000);

  const avgCompletionMins =
    completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : null;

  // Step-level skip analysis — which checklist items get ticked least often
  const itemTickCounts = new Map<string, { text: string; stepTitle: string; tickedCount: number }>();
  for (const step of sop.steps) {
    for (const item of step.checklistItems) {
      itemTickCounts.set(item.id, { text: item.text, stepTitle: step.title, tickedCount: 0 });
    }
  }
  for (const run of runs) {
    const seenInThisRun = new Set<string>();
    for (const log of run.stepLogs) {
      if (log.done && !seenInThisRun.has(log.checklistItemId)) {
        seenInThisRun.add(log.checklistItemId);
        const entry = itemTickCounts.get(log.checklistItemId);
        if (entry) entry.tickedCount += 1;
      }
    }
  }

  // 👇 Worst-completion-rate steps sabse upar — manager ko turant pata
  // chalna chahiye kahan sabse zyada dikkat hai, alphabetical/step-order nahi
  const stepBreakdown = Array.from(itemTickCounts.values())
    .map((entry) => ({
      ...entry,
      completionRate: totalRuns > 0 ? Math.round((entry.tickedCount / totalRuns) * 100) : 0,
    }))
    .sort((a, b) => a.completionRate - b.completionRate);

  return NextResponse.json({
    sop: { title: sop.title, description: sop.description, createdAt: sop.createdAt },
    summary: {
      totalRuns,
      completedRuns,
      inProgressRuns,
      overdueRuns,
      avgCompletionMins,
    },
    stepBreakdown,
    runs: runs.map((r) => ({
      id: r.id,
      executorEmail: r.executorEmail,
      executorName: r.executorName,
      status: r.status,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      completedItems: r.completedItems,
      totalItems: r.totalItems,
    })),
  });
}