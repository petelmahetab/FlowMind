import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Zap, Share2, CheckCircle } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-5xl mx-auto">
        <span className="font-bold text-xl text-indigo-600">FlowMind</span>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Free — no credit card required
        </span>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Turn messy processes into
          <span className="text-indigo-600"> clear SOPs</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 leading-relaxed">
          Describe any process in plain English. AI turns it into a structured,
          shareable runbook with steps, owners, and checklists — in seconds.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-indigo-700 transition-colors"
        >
          Create your first SOP free
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-sm text-gray-400 mt-4">3 SOPs free forever · No credit card</p>
      </section>

      {/* Demo box */}
      <section className="max-w-3xl mx-auto px-6 mb-24">
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <p className="text-sm text-gray-500 mb-3">You type:</p>
          <p className="text-gray-700 italic mb-6 bg-white rounded-lg p-4 border border-gray-200">
            "To deploy our app: push to main branch, SSH into server, run docker-compose
            up, check health endpoint, notify team on Slack"
          </p>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm text-indigo-600 font-medium">AI generates →</span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            {[
              { step: "1", title: "Push code to main branch", owner: "Developer" },
              { step: "2", title: "SSH into production server", owner: "DevOps" },
              { step: "3", title: "Run docker-compose up", owner: "DevOps" },
              { step: "4", title: "Verify health endpoint", owner: "Developer" },
              { step: "5", title: "Notify team on Slack", owner: "Team Lead" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {s.step}
                </span>
                <span className="text-sm text-gray-800 flex-1">{s.title}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {s.owner}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 mb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: "AI-powered", desc: "Describe in plain English, get structured SOPs instantly" },
          { icon: Share2, title: "Shareable link", desc: "One click to generate a public read-only link" },
          { icon: CheckCircle, title: "Interactive checklists", desc: "Team members tick off steps as they work" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <Icon className="w-5 h-5 text-indigo-600 mb-3" />
            <p className="font-semibold text-gray-900 mb-1">{title}</p>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="max-w-2xl mx-auto px-6 mb-24">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Simple pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-200 p-6">
            <p className="font-semibold text-gray-900 mb-1">Free</p>
            <p className="text-3xl font-bold mb-4">$0</p>
            {["3 SOPs", "AI generation", "Public share links", "Checklists"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> {f}
              </div>
            ))}
          </div>
          <div className="rounded-xl border-2 border-indigo-600 p-6">
            <p className="font-semibold text-gray-900 mb-1">Pro</p>
            <p className="text-3xl font-bold mb-4">$7<span className="text-base font-normal text-gray-400">/mo</span></p>
            {["Unlimited SOPs", "Team workspace", "Export PDF/Markdown", "Priority support"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <CheckCircle className="w-4 h-4 text-indigo-500" /> {f}
              </div>
            ))}
            <Link href="/sign-up" className="block text-center mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-1">
          <FileText className="w-4 h-4" />
          <span>FlowMind — built with Next.js, Prisma, Clerk, Gemini</span>
        </div>
      </footer>
    </main>
  );
}
