import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  // ─── Verify Svix signature (security — reject fake webhooks) ───
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ─── Handle user.created event ───
  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.upsert({
      where: { clerkId: id },
      update: { email, name, imageUrl: image_url },
      create: {
        clerkId: id,
        email: email!,
        name,
        imageUrl: image_url,
        plan: "free",
      },
    });

    // ─── Fire background job: send welcome email via Inngest ───
    await inngest.send({
      name: "user/signed-up",
      data: { email, name },
    });
  }

  // ─── Handle user.updated event ───
  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.update({
      where: { clerkId: id },
      data: { email, name, imageUrl: image_url },
    });
  }

  // ─── Handle user.deleted event ───
  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await prisma.user.delete({ where: { clerkId: id } });
    }
  }

  return NextResponse.json({ received: true });
}
