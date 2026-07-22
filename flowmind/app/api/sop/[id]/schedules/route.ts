import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getNextRun } from "@/lib/cron";

const scheduleSchema = z.object({
  cronExpression: z.string().min(1),
  cronLabel: z.string().min(1),
  assigneeEmails: z.array(z.string().email()).min(1),
  deadlineHours: z.number().min(1).max(168).default(24),
});

// GET — is SOP ke saare schedules
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const schedules = await prisma.sopSchedule.findMany({
    where: { sopId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(schedules);
}

// POST — naya schedule create karo (Pro feature)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sopId } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Scheduled runs Pro-only feature — free tier ko block karo
  if (user.plan !== "pro") {
    return NextResponse.json(
      { error: "Scheduled runs are a Pro feature. Upgrade to unlock.", code: "UPGRADE_REQUIRED" },
      { status: 403 }
    );
  }

  const sop = await prisma.sop.findFirst({
    where: { id: sopId, userId: user.id },
  });
  if (!sop) return NextResponse.json({ error: "SOP not found" }, { status: 404 });

  const body = await req.json();
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const nextRunAt = getNextRun(parsed.data.cronExpression);

  const schedule = await prisma.sopSchedule.create({
    data: {
      sopId,
      cronExpression: parsed.data.cronExpression,
      cronLabel: parsed.data.cronLabel,
      assigneeEmails: parsed.data.assigneeEmails,
      deadlineHours: parsed.data.deadlineHours,
      nextRunAt,
      isActive: true,
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}

// DELETE — schedule band karo
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sopId } = await params;
  const { scheduleId } = await req.json();

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.sopSchedule.deleteMany({
    where: { id: scheduleId, sopId, sop: { userId: user.id } },
  });

  return NextResponse.json({ deleted: true });
}