import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, User2, Share2 } from "lucide-react";

export default async function PublicSopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const sop = await prisma.sop.findFirst({
    where: { shareSlug: slug, isPublic: true },
    include: {
      steps: {
        include: { checklistItems: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      user: { select: { name: true } },
    },
  });

  if (!sop) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mb-2 inline-block">
                Standard Operating Procedure
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{sop.title}</h1>
              {sop.description && (
                <p className="text-gray-500 mt-1">{sop.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                By {sop.user.name ?? "FlowMind user"} ·{" "}
                {sop.steps.length} steps
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {sop.steps.map((step, i) => (
          <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                {step.description && (
                  <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {step.owner && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <User2 className="w-3 h-3" /> {step.owner}
                    </span>
                  )}
                  {step.durationMins && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" /> {step.durationMins} min
                    </span>
                  )}
                </div>
                {step.checklistItems.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {step.checklistItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="max-w-2xl mx-auto px-6 pb-12 text-center">
        <p className="text-sm text-gray-400 mb-3">Made with FlowMind</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <Share2 className="w-4 h-4" />
          Create your own free SOPs
        </a>
      </div>
    </main>
  );
}
