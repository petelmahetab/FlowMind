import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — is SOP ke saare execution runs (owner dekhega)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const runs = await prisma.executionRun.findMany({
    where: { sopId: id },
    orderBy: { startedAt: "desc" },
    include: { stepLogs: true },
  });

  return NextResponse.json(runs);
}

// POST — naya execution run start karo (login required nahi — email se identify)
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

  const totalItems = sop.steps.reduce((sum, step) => sum + step.checklistItems.length, 0);

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