import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/sop/DashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // User fetch karo, na mile toh create karo
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      sops: {
        orderBy: { createdAt: "desc" },
        include: { steps: { select: { id: true } } },
      },
    },
  });

  // ← Yeh add karo — redirect ki jagah upsert
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: "",      // Clerk webhook se baad mein update hoga
        plan: "free",
      },
      include: {
        sops: {
          orderBy: { createdAt: "desc" },
          include: { steps: { select: { id: true } } },
        },
      },
    });
  }

  return <DashboardClient initialUser={user} />;
}