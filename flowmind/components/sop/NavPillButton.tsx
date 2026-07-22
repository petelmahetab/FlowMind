"use client";

import { LucideIcon, Crown } from "lucide-react";

type Variant = "neutral" | "proLocked" | "proActive" | "signature";

type Props = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant: Variant;
};

const variantClasses: Record<Variant, string> = {
  neutral:
    "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
  proLocked:
    "nav-pill-shimmer bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_4px_12px_-2px_rgba(245,158,11,0.25)]",
  proActive:
    "bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_4px_16px_-2px_rgba(99,102,241,0.35)]",
  signature:
    "nav-pill-glow bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent hover:from-indigo-500 hover:to-violet-500",
};

export default function NavPillButton({ icon: Icon, label, onClick, variant }: Props) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border
        transition-all duration-300 ease-out
        hover:-translate-y-0.5 active:translate-y-0 active:scale-95
        whitespace-nowrap flex-shrink-0 ${variantClasses[variant]}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="hidden sm:inline">{label}</span>

      {variant === "proLocked" && (
        <Crown className="w-3 h-3 ml-0.5 flex-shrink-0" />
      )}
      {variant === "proActive" && (
        <span className="hidden sm:inline text-[9px] font-bold tracking-wide bg-indigo-600 text-white px-1.5 py-0.5 rounded-full ml-0.5">
          PRO
        </span>
      )}
    </button>
  );
}