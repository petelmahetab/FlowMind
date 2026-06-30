import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { executorEmail, executorName } = await req.json();

  if (!executorEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const sop = await prisma.sop.findUnique({
    where: { id },
    include: { steps: { include: { checklistItems: true } } },
  });

  if (!sop) return NextResponse.json({ error: "SOP not found" }, { status: 404 });

  const totalItems = sop.steps.reduce(
    (sum, step) => sum + step.checklistItems.length, 0
  );

  const run = await prisma.executionRun.create({
    data: {
      sopId: id,
      executorEmail,
      executorName: executorName ?? null,
      totalItems,
      completedItems: 0,
      status: "in_progress",
    },
  });

  return NextResponse.json(run);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const runs = await prisma.executionRun.findMany({
    where: { sopId: id },
    orderBy: { startedAt: "desc" },
    include: { stepLogs: true },
  });

  return NextResponse.json(runs);
}