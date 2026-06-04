import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SOP_TEMPLATES } from "@/lib/templates";
import { generateSlug } from "@/lib/utils";   // ← Yeh import add karo

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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  // --- Template flow ---
  if (body.type === "template") {
    const template = SOP_TEMPLATES.find((t) => t.id === body.templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const sop = await prisma.sop.create({
      data: {
        title: template.title,
        description: template.description || "",
        userId: user.id,
        isPublic: false,
        rawText: `Template: ${template.title}`,           // required
        shareSlug: generateSlug(),                         // ← Yeh line add ki (important)
        steps: {
          create: template.steps.map((step) => ({
            title: step.title,
            description: step.description,
            owner: step.owner,
            durationMins: parseInt(step.duration) || null,
            order: step.order,
            checklistItems: {
              create: []
            },
          })),
        },
      },
      include: {
        steps: {
          include: { checklistItems: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(sop);
  }

  // --- AI / BrainDump flow (yahan apna purana code paste kar do) ---
  // ... existing code ...

  return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
}