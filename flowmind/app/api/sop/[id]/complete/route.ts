import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const completeSchema = z.object({
  stepId: z.string().min(1),
  completed: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sopId } = await params;
    const body = await req.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { stepId, completed } = parsed.data;

    const step = await prisma.step.findFirst({
      where: { id: stepId, sopId, sop: { user: { clerkId: userId } } },
    });
    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const updated = await prisma.step.update({
      where: { id: stepId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? userId : null,
      },
    });

    const allSteps = await prisma.step.findMany({
      where: { sopId },
      select: { completed: true },
    });
    const allDone = allSteps.length > 0 && allSteps.every((s) => s.completed);

    if (allDone) {
      await prisma.sopAssignment.updateMany({
        where: { sopId, status: { in: ["pending", "in_progress"] } },
        data: { status: "completed", completedAt: new Date() },
      });
    } else if (completed) {
      await prisma.sopAssignment.updateMany({
        where: { sopId, status: "pending" },
        data: { status: "in_progress" },
      });
    }

    return NextResponse.json({
      stepId: updated.id,
      completed: updated.completed,
    });
  } catch (err) {
    console.error("[sop/complete] error:", err);
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}