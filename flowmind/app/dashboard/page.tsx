import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/sop/DashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  // upsert — already hai toh update, nahi hai toh create
  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
      name: [clerkUser?.firstName, clerkUser?.lastName]
        .filter(Boolean)
        .join(" ") || null,
      imageUrl: clerkUser?.imageUrl ?? null,
    },
    create: {
      clerkId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
      name: [clerkUser?.firstName, clerkUser?.lastName]
        .filter(Boolean)
        .join(" ") || null,
      imageUrl: clerkUser?.imageUrl ?? null,
      plan: "free",
    },
    include: {
      sops: {
        orderBy: { createdAt: "desc" },
        include: { steps: { select: { id: true } } },
      },
    },
  });

  return <DashboardClient initialUser={user} />;
}