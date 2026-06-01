# FlowMind — AI-powered SOP Builder

> Turn any process described in plain English into a structured, shareable runbook using AI.

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 15 App Router | Server components + API routes in one |
| Auth | Clerk | OAuth, magic link, webhooks built-in |
| Database | PostgreSQL on Supabase | Free tier, managed |
| ORM | Prisma | Type-safe DB queries |
| AI | Google Gemini 1.5 Flash | Free (1500 req/day), JSON output mode |
| Drag & drop | dnd-kit | Steps reordering |
| Data fetching | TanStack Query | Client-side cache + invalidation |
| Background jobs | Inngest | Welcome email async |
| Email | Resend | 3000 free emails/month |
| Deploy | Vercel | Free tier, zero config |

---

## Local Setup — Step by Step

### Step 1 — Clone and install

```bash
# 1. Create Next.js app (do this first on your machine)
npx create-next-app@latest flowmind --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"
cd flowmind

# 2. Delete the default app/page.tsx — we replace everything
# 3. Copy all files from this project into the folder
# 4. Install dependencies
npm install
```

### Step 2 — Supabase (free PostgreSQL)

1. Go to **supabase.com** → New project
2. Note your **project password**
3. Go to **Settings → Database → Connection string**
4. Copy **Transaction mode** URL (port 6543) → paste as `DATABASE_URL` in `.env.local`
5. Copy **Session mode** URL (port 5432) → paste as `DIRECT_URL` in `.env.local`

```
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### Step 3 — Clerk (free auth)

1. Go to **clerk.com** → Create application
2. Enable **Google** and **GitHub** OAuth providers
3. Go to **API Keys** → copy both keys into `.env.local`

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

4. Go to **Webhooks** → Add endpoint
   - URL: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk` (for local dev use ngrok)
   - Events to listen: `user.created`, `user.updated`, `user.deleted`
   - Copy **Signing Secret** → paste as `CLERK_WEBHOOK_SECRET`

> **For local webhook testing:** Install ngrok → run `ngrok http 3000` → use the https URL

### Step 4 — Gemini API Key (completely free)

1. Go to **aistudio.google.com**
2. Click **Get API Key** → Create API key
3. Copy → paste as `GEMINI_API_KEY` in `.env.local`

```
GEMINI_API_KEY=AIzaSy_...
```

### Step 5 — Resend (free email)

1. Go to **resend.com** → Sign up
2. Go to **API Keys** → Create key
3. Paste as `RESEND_API_KEY`
4. In `lib/inngest.ts` — update the `from` email to use your verified domain

### Step 6 — Push database schema

```bash
npx prisma generate    # generates Prisma client
npx prisma db push     # pushes schema to Supabase
```

You should see all 4 tables created: `User`, `Sop`, `Step`, `ChecklistItem`

### Step 7 — Run locally

```bash
npm run dev
```

Open **http://localhost:3000** — you should see the landing page.

**Test the full flow:**
1. Click "Get started free"
2. Sign up with Google
3. You land on `/dashboard`
4. Click "+ New SOP"
5. Type a process description
6. Click "Generate SOP"
7. You're redirected to the editor

---

## Vercel Deployment

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/flowmind.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to **vercel.com** → New Project
2. Import your GitHub repo
3. **Framework preset:** Next.js (auto-detected)
4. **Environment variables:** Add ALL variables from `.env.local`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `GEMINI_API_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
5. Click **Deploy**

### Step 3 — Update Clerk webhook URL

After deploy, go to Clerk Dashboard → Webhooks → update endpoint URL to your Vercel URL:
```
https://your-app.vercel.app/api/webhooks/clerk
```

### Step 4 — Run Prisma migrate on production

In Vercel dashboard → your project → Settings → Functions → add build command:
```
prisma generate && prisma db push
```

Or run from local:
```bash
DATABASE_URL="your-production-url" npx prisma db push
```

---

## Project Structure

```
flowmind/
├── app/
│   ├── (auth)/sign-in/     → Clerk sign-in page
│   ├── (auth)/sign-up/     → Clerk sign-up page
│   ├── dashboard/          → Protected workspace
│   │   └── sop/[id]/       → SOP editor
│   ├── sop/[slug]/         → Public share page (no auth)
│   ├── api/
│   │   ├── webhooks/clerk/ → Syncs Clerk user to DB
│   │   ├── generate/       → Calls Gemini, saves SOP
│   │   ├── sop/            → CRUD for SOPs
│   │   ├── user/me/        → Returns plan + count
│   │   └── inngest/        → Background job handler
│   ├── layout.tsx          → ClerkProvider + QueryProvider
│   └── page.tsx            → Landing page
├── components/
│   ├── sop/
│   │   ├── DashboardClient.tsx   → SOP list, new button
│   │   ├── BrainDumpModal.tsx    → Plain text input
│   │   ├── SopEditorClient.tsx   → Editor with drag-drop
│   │   ├── StepItem.tsx          → Single step component
│   │   └── UpgradeModal.tsx      → Freemium gate
│   └── Providers.tsx             → TanStack Query wrapper
├── hooks/
│   └── usePlan.ts          → Freemium check hook
├── lib/
│   ├── prisma.ts           → Singleton DB client
│   ├── gemini.ts           → AI generation
│   ├── inngest.ts          → Background jobs
│   └── utils.ts            → cn(), generateSlug()
├── prisma/
│   └── schema.prisma       → DB schema
├── types/
│   └── index.ts            → Shared TypeScript types
├── middleware.ts            → Clerk route protection
└── .env.local              → All secrets (never commit)
```

---

## Common Interview Questions About This Project

**Q: Why Next.js App Router instead of MERN?**
A: Server components fetch data directly from DB without an API call, reducing round trips. One codebase, one deploy. MERN requires managing two separate servers.

**Q: How does the freemium gate work?**
A: Two-layer approach. Client-side `usePlan()` hook shows upgrade modal immediately (UX). Server-side counts SOPs in DB before every create — cannot be bypassed even with direct API calls.

**Q: Why is the Prisma singleton pattern needed?**
A: Next.js hot-reload in dev creates new module instances on each file save. Without `global.prisma`, each reload creates a new connection pool and exhausts Supabase's connection limit.

**Q: What does the Clerk webhook do exactly?**
A: Clerk stores auth data (passwords, OAuth tokens) in their system. Your DB stores app data (SOPs, plan). When user signs up, Clerk fires a webhook to `/api/webhooks/clerk`. The handler creates a matching `User` row in your Postgres. Without this, users can log in but have no app data.

**Q: How is the webhook secured?**
A: Clerk signs every webhook with Svix. The handler calls `svix.verify(body, headers)` — if signature doesn't match, returns 400. Impossible to fake a webhook POST without the signing secret.

**Q: Why Inngest for the welcome email?**
A: The webhook handler needs to respond fast. If Resend is slow or fails, the webhook would time out. Inngest queues the email as a background job — webhook returns 200 immediately, email sends asynchronously with automatic retries.

**Q: How does the drag-and-drop work?**
A: dnd-kit's `useSortable` hook gives each `StepItem` a ref, drag handle listeners, and CSS transform values. `DndContext` tracks the drag state. On `dragEnd`, `arrayMove` reorders the array in React state (optimistic update).

---

## Extending This Project

- **Stripe billing:** Add `/api/checkout` route with Stripe Checkout, webhook to update `user.plan = "pro"`
- **Mermaid diagrams:** Add a `/api/diagram/[id]` route that prompts Gemini to output Mermaid syntax, render client-side
- **Step inline AI improve:** On hover, call `/api/improve-step` with the step text, show accept/reject diff
- **PDF export:** Use `@react-pdf/renderer` to generate a PDF of the full SOP
- **Team workspaces:** Add `Workspace` model, `WorkspaceMember` with role enum, scope all SOP queries to workspace
