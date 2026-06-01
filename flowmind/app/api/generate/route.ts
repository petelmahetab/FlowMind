import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateSopFromText } from "@/lib/gemini";
import { generateSlug, FREE_LIMIT } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const generateSchema = z.object({
  rawText: z.string().min(20, "Describe the process in at least 20 characters").max(2000),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─── Get user from OUR database ───
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ─── SERVER-SIDE freemium gate ───
    if (user.plan === "free") {
      const count = await prisma.sop.count({ where: { userId: user.id } });
      if (count >= FREE_LIMIT) {
        return NextResponse.json(
          { error: "LIMIT_REACHED", message: "Upgrade to Pro to create more SOPs" },
          { status: 403 }
        );
      }
    }

    // ─── Validate request body ───
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { rawText } = parsed.data;

    // ─── Call Gemini ───
    const generated = await generateSopFromText(rawText);

    // ─── Save to database as a tree: SOP → Steps → ChecklistItems ───
    const sop = await prisma.sop.create({
      data: {
        userId: user.id,
        title: generated.title,
        description: generated.description,
        rawText,
        shareSlug: generateSlug(),
        isPublic: false,
        steps: {
          create: generated.steps.map((step, stepIndex) => ({
            title: step.title,
            description: step.description,
            owner: step.owner ?? null,
            durationMins: step.durationMins ?? null,
            order: stepIndex,
            checklistItems: {
              create: step.checklistItems.map((item, itemIndex) => ({
                text: item.text,
                done: false,
                order: itemIndex,
              })),
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

    return NextResponse.json(sop, { status: 201 });
  } catch (err) {
    console.error("[generate] error:", err);
    return NextResponse.json({ error: "Failed to generate SOP" }, { status: 500 });
  }
}
