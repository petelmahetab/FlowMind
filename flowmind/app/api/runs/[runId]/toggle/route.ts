import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const { checklistItemId, done } = await req.json();

  // Log entry banao — audit trail ke liye
  await prisma.executionStepLog.create({
    data: { runId, checklistItemId, done },
  });

  // Run ke completedItems count update karo
  const run = await prisma.executionRun.findUnique({ where: { id: runId } });
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  // Distinct completed items count karo (latest state per item)
  const allLogs = await prisma.executionStepLog.findMany({
    where: { runId },
    orderBy: { toggledAt: "desc" },
  });

  const latestStatePerItem = new Map<string, boolean>();
  for (const log of allLogs) {
    if (!latestStatePerItem.has(log.checklistItemId)) {
      latestStatePerItem.set(log.checklistItemId, log.done);
    }
  }

  const completedItems = Array.from(latestStatePerItem.values()).filter(Boolean).length;
  const isAllDone = completedItems === run.totalItems && run.totalItems > 0;

  const updatedRun = await prisma.executionRun.update({
    where: { id: runId },
    data: {
      completedItems,
      status: isAllDone ? "completed" : "in_progress",
      completedAt: isAllDone ? new Date() : null,
    },
  });

  return NextResponse.json(updatedRun);
}