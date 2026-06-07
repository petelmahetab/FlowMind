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

  const sop = await prisma.sop.findFirst({
    where: { id, userId: user.id },
    include: {
      steps: {
        include: { checklistItems: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!sop) notFound();

  // 👇 User ki existing completions fetch karo
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