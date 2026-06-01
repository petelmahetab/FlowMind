import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getAuthorizedSop(sopId: string, clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  const sop = await prisma.sop.findFirst({
    where: { id: sopId, userId: user.id },
    include: {
      steps: {
        include: { checklistItems: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });
  return sop;
}

// GET /api/sop/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sop = await getAuthorizedSop(id, userId);
  if (!sop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(sop);
}

// PATCH /api/sop/[id] — update title, description, isPublic
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, description, isPublic } = body;

  const sop = await prisma.sop.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(isPublic !== undefined && { isPublic }),
    },
  });

  if (sop.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ updated: true });
}

// DELETE /api/sop/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.sop.deleteMany({ where: { id, userId: user.id } });

  return NextResponse.json({ deleted: true });
}
