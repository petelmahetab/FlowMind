import type { Sop, Step, ChecklistItem, User } from "@prisma/client";

export type SopWithSteps = Sop & {
  steps: (Step & {
    checklistItems: ChecklistItem[];
  })[];
};

export type UserWithSops = User & {
  sops: Sop[];
};

export type ApiError = {
  error: string;
  message?: string;
};
