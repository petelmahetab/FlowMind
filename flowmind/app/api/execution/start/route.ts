import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const startSchema = z.object({
  sopId: z.string().min(1),
  executorEmail: z.string().email(),
  executorName: z.string().optional(),
});

// POST /api/execution/start
// Called from the public share page when someone begins following a SOP.
// No auth required — the public share link is the entry point.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { sopId, executorEmail, executorName } = parsed.data;

    const sop = await prisma.sop.findUnique({
      where: { id: sopId },
      include: { steps: { include: { checklistItems: true } } },
    });

    if (!sop || !sop.isPublic) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    const existing = await prisma.executionRun.findFirst({
      where: {
        sopId,
        executorEmail,
        status: { in: ["in_progress", "overdue"] },
      },
      include: { stepLogs: true },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const totalItems = sop.steps.reduce(
      (sum, step) => sum + step.checklistItems.length,
      0
    );

    const run = await prisma.executionRun.create({
      data: {
        sopId,
        executorEmail,
        executorName,
        totalItems,
        completedItems: 0,
        status: "in_progress",
      },
      include: { stepLogs: true },
    });

    return NextResponse.json(run, { status: 201 });
  } catch (err) {
    console.error("[execution/start] error:", err);
    return NextResponse.json(
      { error: "Failed to start execution run" },
      { status: 500 }
    );
  }
}