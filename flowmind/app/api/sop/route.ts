import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/sop — list all SOPs for the logged-in user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sops = await prisma.sop.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      steps: { select: { id: true }, orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(sops);
}
