import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — is SOP ke saare assignments list karo
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const assignments = await prisma.sopAssignment.findMany({
    where: { sopId: id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, imageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
}

// POST — naya assignment create karo (email se)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assigner = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!assigner) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const { email, dueDate } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Assignee already FlowMind user hai ya nahi check karo
  const assignee = await prisma.user.findUnique({ where: { email } });

  if (!assignee) {
    return NextResponse.json(
      { error: "This person hasn't signed up on FlowMind yet. Ask them to sign up first." },
      { status: 404 }
    );
  }

  const sop = await prisma.sop.findUnique({ where: { id } });
  if (!sop || sop.userId !== assigner.id) {
    return NextResponse.json({ error: "SOP not found" }, { status: 404 });
  }

  const assignment = await prisma.sopAssignment.upsert({
    where: { sopId_assignedToId: { sopId: id, assignedToId: assignee.id } },
    create: {
      sopId: id,
      assignedById: assigner.id,
      assignedToId: assignee.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "pending",
    },
    update: {
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, imageUrl: true } },
    },
  });

  return NextResponse.json(assignment);
}

// DELETE — assignment remove karo
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assignmentId } = await req.json();

  await prisma.sopAssignment.delete({ where: { id: assignmentId } });

  return NextResponse.json({ success: true });
}