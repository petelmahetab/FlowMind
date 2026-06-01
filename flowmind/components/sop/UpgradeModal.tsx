"use client";

import { X, Zap, Check, ArrowRight } from "lucide-react";

type Props = { onClose: () => void };

const PRO_FEATURES = [
  "Unlimited SOPs",
  "Team workspace",
  "Export to PDF & Markdown",
  "Priority support",
  "Everything in Free",
];

export default function UpgradeModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-900 mt-2">
            You've hit the free limit
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Free plan allows 3 SOPs. Upgrade to Pro for unlimited SOPs and team
            features.
          </p>

          {/* Features list */}
          <div className="mt-5 space-y-2">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="mt-5 bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">
              $7
              <span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Cancel anytime</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              // In production: redirect to Stripe checkout
              // window.location.href = "/api/checkout"
              alert(
                "Stripe integration: connect your Stripe account and add /api/checkout route. For now this is a mock."
              );
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
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
