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

    // Guard check bahar rakha hai (transaction shuru hone se pehle) —
    // taaki already-completed run pe turant fail-fast ho jaaye,
    // bina ek transaction start kiye
    const existingRun = await prisma.executionRun.findUnique({
      where: { id: runId },
      include: { sop: { select: { dueDate: true } } },
    });
    if (!existingRun) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    if (existingRun.status === "completed") {
      return NextResponse.json(
        { error: "This run is already completed" },
        { status: 400 }
      );
    }

    // Sab kuch ek hi transaction ke andar — Serializable isolation
    // ensures ki parallel toggle requests ek dusre ko overwrite na karein
    const updated = await prisma.$transaction(async (tx) => {
      await tx.executionStepLog.create({
        data: { runId, checklistItemId, done },
      });

      const run = await tx.executionRun.findUnique({
        where: { id: runId },
        include: { sop: { select: { dueDate: true } } },
      });
      if (!run) throw new Error("RUN_NOT_FOUND");

      const logs = await tx.executionStepLog.findMany({
        where: { runId },
        orderBy: { toggledAt: "desc" },
        select: { checklistItemId: true, done: true },
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

      return tx.executionRun.update({
        where: { id: runId },
        data: {
          completedItems,
          status: isNowComplete ? "completed" : isOverdue ? "overdue" : "in_progress",
          completedAt: isNowComplete ? new Date() : null,
        },
      });
    }, {
      isolationLevel: "Serializable",
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.message === "RUN_NOT_FOUND") {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    
    console.error("[execution/tick] error:", err);
    return NextResponse.json(
      { error: "Failed to update, please retry" },
      { status: 409 }
    );
  }
}