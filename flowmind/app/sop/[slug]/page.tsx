import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Share2 } from "lucide-react";
import ExecutableSopView from "@/components/execution/ExecutableSopView";

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded mb-2 inline-block">
            Standard Operating Procedure
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {sop.title}
          </h1>
          {sop.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{sop.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            By {sop.user.name ?? "FlowMind user"} · {sop.steps.length} steps
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <ExecutableSopView sopId={sop.id} steps={sop.steps} />
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-12 text-center">
        <p className="text-sm text-gray-400 mb-3">Made with FlowMind</p>
        
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