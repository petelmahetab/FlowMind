import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createSopVersion } from "@/lib/version-helper";


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const versions = await prisma.sopVersion.findMany({
    where: { sopId: id },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json(versions);
}


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const clerkUser = await currentUser();
  const editorName = clerkUser?.firstName ?? user.name ?? "Someone";

  const sop = await prisma.sop.findUnique({
    where: { id },
    include: { steps: { include: { checklistItems: true }, orderBy: { order: "asc" } } },
  });

  if (!sop) return NextResponse.json({ error: "SOP not found" }, { status: 404 });

  const { changeSummary } = await req.json().catch(() => ({ changeSummary: undefined }));

  const version = await createSopVersion(
    sop.id,
    sop.steps,
    sop.title,
    sop.description,
    editorName,
    changeSummary
  );

  return NextResponse.json(version);
}