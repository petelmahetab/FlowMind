import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(): string {
  // e.g. "deploy-frontend-k3x9p"
  return nanoid(10);
}

export const FREE_LIMIT = 3;
