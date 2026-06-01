"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/ThemeToggle";

// Prisma User type ke saath match karna chahiye
interface Sop {
  id: string;
  createdAt: Date;
  steps: { id: string }[];
  [key: string]: unknown;
}

interface User {
  id: string;
  clerkId: string;
  email: string;
  plan: string;
  sops: Sop[];
}

interface DashboardClientProps {
  initialUser: User;
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const plan = initialUser.plan as "free" | "pro";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="text-xl font-bold tracking-tight">
          FlowMind
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {plan === "free" && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Upgrade to Pro
            </button>
          )}

          {/* suppressHydrationWarning — Clerk UserButton SSR mismatch fix */}
          <div suppressHydrationWarning>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {plan === "pro"
            ? "You're on the Pro plan 🎉"
            : "You're on the Free plan. Upgrade for more features."}
        </p>

        {/* SOPs list */}
        {initialUser.sops.length === 0 ? (
          <div className="mt-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-lg">No SOPs yet.</p>
            <p className="text-sm mt-1">Create your first SOP to get started.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {initialUser.sops.map((sop) => (
              <div
                key={sop.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{sop.id}</span>
                  <span className="text-sm text-gray-400">
                    {sop.steps.length} steps
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-2">Upgrade to Pro</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Unlock all features with the Pro plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgrade(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Stripe checkout ya billing page pe redirect karo
                  setShowUpgrade(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}