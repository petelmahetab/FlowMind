import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST — step complete/incomplete toggle
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { stepId, completed } = await req.json();

  if (completed) {
    // Completion record create karo — already hai toh ignore
    await prisma.stepCompletion.upsert({
      where: { userId_stepId: { userId: user.id, stepId } },
      create: { userId: user.id, stepId, sopId: params.id },
      update: { completedAt: new Date() },
    });
  } else {
    // Completion record delete karo
    await prisma.stepCompletion.deleteMany({
      where: { userId: user.id, stepId },
    });
  }

  // Updated progress return karo
  const totalSteps = await prisma.step.count({ where: { sopId: params.id } });
  const completedSteps = await prisma.stepCompletion.count({
    where: { userId: user.id, sopId: params.id },
  });

  return NextResponse.json({ completedSteps, totalSteps });
}

// GET — is SOP ke liye user ki completions fetch karo
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const completions = await prisma.stepCompletion.findMany({
    where: { userId: user.id, sopId: params.id },
    select: { stepId: true, completedAt: true },
  });

  const totalSteps = await prisma.step.count({ where: { sopId: params.id } });

  return NextResponse.json({
    completedStepIds: completions.map((c) => c.stepId),
    completedSteps: completions.length,
    totalSteps,
  });
}