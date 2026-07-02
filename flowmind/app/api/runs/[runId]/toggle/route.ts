import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const { checklistItemId, done } = await req.json();

  if (!checklistItemId || typeof done !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updatedRun = await prisma.$transaction(
      async (tx) => {
        // 1. Log entry banao (audit trail)
        await tx.executionStepLog.create({
          data: { runId, checklistItemId, done },
        });

        const run = await tx.executionRun.findUnique({ where: { id: runId } });
        if (!run) throw new Error("RUN_NOT_FOUND");

        // 2. Completed count — ab poore logs JS mein fetch-process nahi karte,
        // seedha SQL se "har item ka latest toggle state" nikालते hain.
        // Yeh transaction ke andar bahut kam time leta hai (lock jaldi release hoti hai).
        const rows = await tx.$queryRaw<{ checklist_item_id: string; done: boolean }[]>`
          SELECT DISTINCT ON ("checklistItemId") "checklistItemId" as checklist_item_id, "done"
          FROM "ExecutionStepLog"
          WHERE "runId" = ${runId}
          ORDER BY "checklistItemId", "toggledAt" DESC
        `;
        const completedItems = rows.filter((r) => r.done).length;

        const isAllDone = completedItems === run.totalItems && run.totalItems > 0;

        return tx.executionRun.update({
          where: { id: runId },
          data: {
            completedItems,
            status: isAllDone ? "completed" : "in_progress",
            completedAt: isAllDone ? new Date() : null,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return NextResponse.json(updatedRun);
  } catch (err: any) {
    if (err.message === "RUN_NOT_FOUND") {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    console.error("[runs/toggle] error:", err);
    return NextResponse.json(
      { error: "Failed to update, please retry" },
      { status: 409 }
    );
  }
}