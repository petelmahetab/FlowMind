import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    // Auto-create user in DB if they exist in Clerk but not in your DB
    const clerkUser = await currentUser();
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser?.fullName ?? null,
      },
    });

    await prisma.sopAssignment.updateMany({
      where: {
        assignedToId: user.id,
        status: { in: ["pending", "in_progress"] },
        dueDate: { lt: new Date() },
      },
      data: { status: "overdue" },
    });

    const assignments = await prisma.sopAssignment.findMany({
      where: { assignedToId: user.id },
      include: {
        sop: { include: { steps: { select: { id: true } } } },
        assignedBy: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("assignments/my error:", error);
    return NextResponse.json([], { status: 200 });
  }
}