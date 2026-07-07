# FlowMind

**Turn messy processes into trackable, shareable Standard Operating Procedures (SOPs).**

FlowMind lets teams generate, organize, execute, and audit SOPs with real-time progress tracking, public sharing, assignments, and PDF exports.

---

## ✨ Features

- **AI-assisted SOP generation** — turn raw text/notes into structured, step-by-step SOPs
- **Step & checklist tracking** — break SOPs into steps with checklist items and conditional branching
- **Execution runs** — track live progress as someone works through an SOP, with completion percentage
- **Public sharing** — share SOPs via a public link (`/sop/[slug]`) without requiring login
- **Assignments** — assign SOPs to team members with due dates and status tracking
- **Audit reports** — generate a full audit trail of SOP executions
- **PDF export** — export any SOP as a polished PDF
- **Authentication** — secure sign-in/sign-up via Clerk
- **Background jobs** — event-driven workflows powered by Inngest

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (via [Supabase](https://supabase.com/)) |
| ORM | [Prisma](https://www.prisma.io/) |
| Auth | [Clerk](https://clerk.com/) |
| Styling | Tailwind CSS + Radix UI |
| Data fetching | TanStack Query |
| Background jobs | [Inngest](https://www.inngest.com/) |
| AI | Google Generative AI, Groq SDK |
| Email | [Resend](https://resend.com/) |
| PDF generation | jsPDF + html2canvas |
| Deployment | [Vercel](https://vercel.com/) |

---

## 📋 Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com/) (or any PostgreSQL) database
- A [Clerk](https://clerk.com/) account for authentication
- API keys for any AI providers you plan to use (Google Generative AI / Groq)

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Database (use the Supabase "Session" pooler on port 5432 for Prisma compatibility)
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/postgres"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=

# AI providers
GOOGLE_GENERATIVE_AI_API_KEY=
GROQ_API_KEY=

# Email
RESEND_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

> ⚠️ **Never commit `.env` to version control.** Rotate any credentials that have been shared or exposed.

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/petelmahetab/FlowMind.git
cd FlowMind

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.example .env
# then fill in the values above

# 4. Generate Prisma client and push schema to your database
npx prisma generate
npx prisma db push

# 5. Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production (`prisma generate && next build`) |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema changes to the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate the Prisma client |

---

## 🗄 Database Schema (Overview)

- **User** — synced from Clerk, owns SOPs
- **Sop** — the SOP itself (title, description, raw text, public share slug)
- **Step** — ordered steps within an SOP, supports conditional branching
- **ChecklistItem** — checkbox items within a step
- **ExecutionRun** — a tracked run of an SOP by an executor
- **ExecutionStepLog** — log of checklist items completed during a run
- **SopAssignment** — assigns an SOP from one user to another with a due date

Run `npx prisma studio` to explore the schema visually.

---

## 🌐 Deployment (Vercel)

1. Push your code to GitHub.
2. Import the repo into [Vercel](https://vercel.com/new).
3. Add all environment variables listed above under **Project Settings → Environment Variables** (set for Production).
4. Use the **Session mode** Supabase connection string (port `5432`) for `DATABASE_URL` — the Transaction mode pooler (port `6543`) can cause `prepared statement already exists` errors with Prisma in serverless environments.
5. Deploy. Vercel will run `prisma generate && next build` automatically.

### Production checklist

- [ ] `next` is on a patched, non-vulnerable version
- [ ] `DATABASE_URL` uses the Session pooler (port 5432) with `pgbouncer=true&connection_limit=1`
- [ ] `DIRECT_URL` is set for migrations
- [ ] All secrets are set in Vercel (not committed to git)
- [ ] Clerk webhook endpoint is configured and verified
- [ ] `npm audit` has no unresolved critical/high vulnerabilities

---

## 🔒 Security

- Never commit `.env` files or API keys.
- Rotate database and third-party credentials if they are ever exposed (e.g. pasted in chat, logs, or committed by mistake).
- Keep Next.js and dependencies patched — check `npm audit` and framework security advisories regularly.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

