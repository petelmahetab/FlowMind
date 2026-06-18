import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SopEditorClient from "@/components/sop/SopEditorClient";

export default async function SopEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  // 👇 Owner YA assigned user dono ko access milna chahiye
  const sop = await prisma.sop.findFirst({
    where: {
      id,
      OR: [
        { userId: user.id },                          // Owner hai
        { assignments: { some: { assignedToId: user.id } } }, // Assigned hai
      ],
    },
    include: {
      steps: {
        include: { checklistItems: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!sop) notFound();

  const completions = await prisma.stepCompletion.findMany({
    where: { userId: user.id, sopId: id },
    select: { stepId: true },
  });

  const initialCompletedIds = completions.map((c) => c.stepId);

  return (
    <SopEditorClient
      initialSop={sop}
      initialCompletedIds={initialCompletedIds}
    />
  );
}