import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateWebhookSecret } from "@/lib/webhook";

// GET — user ke saare webhooks list karo
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const webhooks = await prisma.webhook.findMany({
    where: { userId: user.id },
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webhooks);
}

// POST — naya webhook register karo
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { url, events } = await req.json();

  if (!url || !events?.length) {
    return NextResponse.json({ error: "URL and events are required" }, { status: 400 });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const secret = generateWebhookSecret();

  const webhook = await prisma.webhook.create({
    data: {
      userId: user.id,
      url,
      events,
      secret,
      isActive: true,
    },
  });

  // Secret sirf create karte waqt return karo — dobara nahi milega
  return NextResponse.json({ ...webhook, deliveries: [], _secretOnce: secret });
}

// DELETE — webhook remove karo
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { webhookId } = await req.json();

  await prisma.webhook.deleteMany({
    where: { id: webhookId, userId: user.id },
  });

  return NextResponse.json({ deleted: true });
}