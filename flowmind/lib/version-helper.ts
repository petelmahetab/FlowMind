import { prisma } from "@/lib/prisma";
import type { Step, ChecklistItem } from "@prisma/client";

type StepWithChecklist = Step & { checklistItems: ChecklistItem[] };


export async function createSopVersion(
  sopId: string,
  steps: StepWithChecklist[],
  title: string,
  description: string | null,
  editedByName: string | null,
  changeSummary?: string
) {
  const lastVersion = await prisma.sopVersion.findFirst({
    where: { sopId },
    orderBy: { versionNumber: "desc" },
  });

  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  return prisma.sopVersion.create({
    data: {
      sopId,
      versionNumber: nextVersionNumber,
      title,
      description,
      stepsSnapshot: JSON.parse(JSON.stringify(steps)), // Prisma Json field ke liye safe serialize
      changeSummary: changeSummary ?? `Version ${nextVersionNumber} saved`,
      editedBy: editedByName,
    },
  });
}