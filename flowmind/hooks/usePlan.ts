"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { FREE_LIMIT } from "@/lib/utils";

type PlanData = {
  plan: "free" | "pro";
  sopCount: number;
};

export function usePlan() {
  const { user, isLoaded } = useUser();

  const { data, isLoading } = useQuery<PlanData>({
    queryKey: ["user-plan", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/user/me");
      if (!res.ok) throw new Error("Failed to fetch plan");
      return res.json();
    },
    enabled: isLoaded && !!user,
    staleTime: 30_000, // re-fetch every 30 seconds
  });

  const plan = data?.plan ?? "free";
  const sopCount = data?.sopCount ?? 0;
  const atLimit = plan === "free" && sopCount >= FREE_LIMIT;
  const remaining = plan === "free" ? Math.max(0, FREE_LIMIT - sopCount) : Infinity;

  return {
    plan,
    sopCount,
    atLimit,
    remaining,
    isPro: plan === "pro",
    isLoading: !isLoaded || isLoading,
  };
}
