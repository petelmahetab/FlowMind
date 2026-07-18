"use client";

import { X, Zap, Check, ArrowRight, Crown } from "lucide-react";
import { FREE_LIMIT } from "@/lib/utils";

type Props = {
  onClose: () => void;
  reason?: "limit" | "feature"; 
};

const PRO_FEATURES = [
  { label: "Unlimited SOPs", free: false },
  { label: "Export to PDF", free: true },
  { label: "Public share links", free: true },
  { label: "Audit Report (compliance export)", free: false },
  { label: "AI SOP Health Analyzer", free: false },
  { label: "Webhook integrations", free: false },
  { label: "Priority support", free: false },
];

export default function UpgradeModal({ onClose, reason = "limit" }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {reason === "limit" ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                You&apos;ve used all {FREE_LIMIT} free SOPs
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Upgrade to Pro for unlimited SOPs and powerful features.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                This is a Pro feature
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Upgrade to Pro to unlock AI analysis, audit reports, webhooks and more.
              </p>
            </>
          )}

          {/* Features list */}
          <div className="mt-5 space-y-2">
            {PRO_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm">
                <Check className={`w-4 h-4 flex-shrink-0 ${f.free ? "text-gray-400" : "text-indigo-500"}`} />
                <span className={f.free ? "text-gray-400" : "text-gray-700 dark:text-gray-300 font-medium"}>
                  {f.label}
                </span>
                {!f.free && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-auto">Pro</span>
                )}
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="mt-5 bg-indigo-50 dark:bg-indigo-950 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              $7
              <span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Cancel anytime</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              alert("Connect Stripe to enable payments — /api/checkout route needed.");
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Upgrade to Pro
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}