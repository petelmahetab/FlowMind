<div align="center">

# ⚡ FlowMind

### Turn messy processes into clear SOPs — instantly.

Describe any workflow in plain English. AI structures it into a shareable, interactive runbook with steps, owners, and checklists.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)

[Live Demo](https://flowmind.vercel.app) · [Report Bug](https://github.com/yourusername/flowmind/issues) · [Request Feature](https://github.com/yourusername/flowmind/issues)

</div>

---

## The Problem

Every team has critical processes that live in someone's head or a messy chat message. When that person leaves — the knowledge walks out with them.

**FlowMind fixes this.** Describe your process once. AI turns it into a structured SOP your whole team can follow, tick off, and share.

---

## Features

- 🤖 **AI Generation** — Plain English in, structured SOP out (Gemini 2.0 Flash)
- ✅ **Interactive Checklists** — Tick off steps as you work
- 🔗 **Public Share Links** — One click to share a read-only runbook
- 🔀 **Drag & Drop** — Reorder steps however you need
- 🌙 **Dark / Light / Auto** — System-aware theme toggle
- 🔒 **Freemium Gating** — 3 SOPs free, upgrade for unlimited

---

## Tech Stack

| | Tool | Purpose |
|---|---|---|
| **Framework** | Next.js 15 App Router | Full-stack, server components |
| **Auth** | Clerk | OAuth, webhooks, user sync |
| **Database** | PostgreSQL + Supabase | Managed, free tier |
| **ORM** | Prisma | Type-safe queries |
| **AI** | Gemini 2.0 Flash | Free, structured JSON output |
| **Data Fetching** | TanStack Query | Client cache + invalidation |
| **Drag & Drop** | dnd-kit | Step reordering |
| **Background Jobs** | Inngest | Async welcome emails |
| **Email** | Resend | Transactional, 3k free/mo |
| **Deploy** | Vercel | Zero config, free tier |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Accounts on: [Supabase](https://supabase.com) · [Clerk](https://clerk.com) · [Google AI Studio](https://aistudio.google.com) · [Resend](https://resend.com)

### Installation

```bash
git clone https://github.com/yourusername/flowmind.git
cd flowmind
npm install --legacy-peer-deps
```

### Environment Setup

Create `.env.local` in the root:

```env
# Supabase — Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.[ref]:[password]@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@pooler.supabase.com:5432/postgres"

# Clerk — dashboard.clerk.com → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Gemini — aistudio.google.com (free)
GEMINI_API_KEY=AIzaSy_xxx

# Resend — resend.com
RESEND_API_KEY=re_xxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
flowmind/
├── app/
│   ├── (auth)/              # Sign in / Sign up
│   ├── dashboard/           # Protected workspace
│   │   └── sop/[id]/        # SOP editor
│   ├── sop/[slug]/          # Public share page
│   └── api/
│       ├── generate/        # Gemini AI call
│       ├── sop/             # CRUD routes
│       ├── user/me/         # Plan + usage
│       ├── webhooks/clerk/  # User sync
│       └── inngest/         # Background jobs
├── components/
│   └── sop/                 # Editor, modals, steps
├── lib/
│   ├── gemini.ts            # AI generation
│   ├── prisma.ts            # DB singleton
│   └── inngest.ts           # Background jobs
├── hooks/
│   └── usePlan.ts           # Freemium gate
└── prisma/
    └── schema.prisma        # DB schema
```

---

## Database Schema

```
User ──< Sop ──< Step ──< ChecklistItem
```

- `User` — synced from Clerk via webhook, holds `plan` (free/pro)
- `Sop` — title, rawText, shareSlug, isPublic
- `Step` — title, description, owner, durationMins, order
- `ChecklistItem` — text, done, order

---

## Deployment

```bash
# Push to GitHub, then:
# 1. vercel.com → New Project → Import repo
# 2. Add all env variables
# 3. Deploy

# Update Clerk webhook URL to:
# https://your-app.vercel.app/api/webhooks/clerk
```

---

## Roadmap

- [ ] Mermaid flowchart auto-generation
- [ ] PDF / Markdown export
- [ ] Team workspaces with role-based access
- [ ] Inline AI step improver
- [ ] Stripe billing integration

---

## License

MIT © [Mahetab Patel](https://github.com/petelmahetab)