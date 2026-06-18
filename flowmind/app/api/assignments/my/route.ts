import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — logged-in user ko assign ki gayi saari SOPs
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const myAssignments = await prisma.sopAssignment.findMany({
    where: { assignedToId: user.id },
    include: {
       sop: { include: { steps: { select: { id: true } } } },
      assignedBy: { select: { name: true, email: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(myAssignments);
}