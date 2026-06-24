import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const tickSchema = z.object({
  checklistItemId: z.string().min(1),
  done: z.boolean(),
});

// POST /api/execution/[runId]/tick
export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const body = await req.json();
    const parsed = tickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { checklistItemId, done } = parsed.data;

    const run = await prisma.executionRun.findUnique({
      where: { id: runId },
      include: { sop: { select: { dueDate: true } } },
    });
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    if (run.status === "completed") {
      return NextResponse.json(
        { error: "This run is already completed" },
        { status: 400 }
      );
    }

    await prisma.executionStepLog.create({
      data: { runId, checklistItemId, done },
    });

    const logs = await prisma.executionStepLog.findMany({
      where: { runId },
      orderBy: { toggledAt: "desc" },
    });

    const latestStateByItem = new Map<string, boolean>();
    for (const log of logs) {
      if (!latestStateByItem.has(log.checklistItemId)) {
        latestStateByItem.set(log.checklistItemId, log.done);
      }
    }
    const completedItems = [...latestStateByItem.values()].filter(Boolean).length;

    const isNowComplete = completedItems >= run.totalItems && run.totalItems > 0;
    const isOverdue =
      !isNowComplete &&
      run.sop.dueDate !== null &&
      new Date() > run.sop.dueDate;

    const updated = await prisma.executionRun.update({
      where: { id: runId },
      data: {
        completedItems,
        status: isNowComplete ? "completed" : isOverdue ? "overdue" : "in_progress",
        completedAt: isNowComplete ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[execution/tick] error:", err);
    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 }
    );
  }
}