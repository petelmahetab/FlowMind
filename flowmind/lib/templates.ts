export type TemplateStep = {
  title: string;
  description: string;
  owner: string;
  duration: string;
  order: number;
};

export type SopTemplate = {
  id: string;
  title: string;
  description: string;
  category: "hr" | "engineering" | "sales" | "operations" | "finance";
  icon: string;
  steps: TemplateStep[];
};

export const SOP_TEMPLATES: SopTemplate[] = [
  {
    id: "employee-onboarding",
    title: "Employee onboarding",
    description: "Day-wise checklist for new joiners",
    category: "hr",
    icon: "user-plus",
    steps: [
      { order: 1, title: "Send welcome email", description: "HR sends welcome email with office address, joining date, and what to bring on day 1.", owner: "HR", duration: "10 min" },
      { order: 2, title: "Setup laptop & accounts", description: "IT creates laptop, sets up email account, Slack, and VPN access.", owner: "IT", duration: "60 min" },
      { order: 3, title: "Assign buddy", description: "Manager assigns a buddy from the team to help new employee settle in.", owner: "Manager", duration: "5 min" },
      { order: 4, title: "Compliance training", description: "New employee completes mandatory compliance training on day 1.", owner: "Employee", duration: "90 min" },
      { order: 5, title: "Team introduction", description: "Team lead introduces new employee to all team members.", owner: "Team Lead", duration: "30 min" },
      { order: 6, title: "Tool access — GitHub & Jira", description: "IT grants access to GitHub repositories and Jira project boards.", owner: "IT", duration: "15 min" },
      { order: 7, title: "Product documentation review", description: "Employee reads product docs, architecture overview, and onboarding wiki.", owner: "Employee", duration: "4 hours" },
      { order: 8, title: "1-on-1 with manager", description: "Manager meets employee on day 3 to set 30-60-90 day goals.", owner: "Manager", duration: "60 min" },
    ],
  },
  {
    id: "employee-offboarding",
    title: "Employee offboarding",
    description: "Knowledge transfer + access revoke checklist",
    category: "hr",
    icon: "user-minus",
    steps: [
      { order: 1, title: "Resignation acknowledgement", description: "HR acknowledges resignation and confirms last working day.", owner: "HR", duration: "10 min" },
      { order: 2, title: "Knowledge transfer doc", description: "Employee documents all ongoing projects, processes, and important context.", owner: "Employee", duration: "4 hours" },
      { order: 3, title: "Handover to team", description: "Employee walks team through all ongoing tasks and pending work.", owner: "Employee + Manager", duration: "2 hours" },
      { order: 4, title: "Revoke all tool access", description: "IT revokes access to GitHub, Slack, Jira, AWS, Notion, and all SaaS tools.", owner: "IT", duration: "30 min" },
      { order: 5, title: "Return company assets", description: "Employee returns laptop, access cards, and any company equipment.", owner: "HR", duration: "15 min" },
      { order: 6, title: "Exit interview", description: "HR conducts exit interview to collect feedback.", owner: "HR", duration: "45 min" },
      { order: 7, title: "Full and final settlement", description: "Finance processes final salary, reimbursements, and relieving letter.", owner: "Finance", duration: "3 days" },
    ],
  },
  {
    id: "code-review",
    title: "Code review checklist",
    description: "PR standards + approval flow",
    category: "engineering",
    icon: "git-pull-request",
    steps: [
      { order: 1, title: "Raise pull request", description: "Developer raises PR with clear title, description, and linked Jira ticket.", owner: "Developer", duration: "10 min" },
      { order: 2, title: "Self review first", description: "Developer reviews their own code before requesting review from others.", owner: "Developer", duration: "15 min" },
      { order: 3, title: "Assign reviewer", description: "Developer assigns relevant senior dev or team lead as reviewer.", owner: "Developer", duration: "2 min" },
      { order: 4, title: "Review within 24 hours", description: "Reviewer checks logic, naming conventions, tests written, docs updated.", owner: "Reviewer", duration: "30 min" },
      { order: 5, title: "Address comments", description: "Developer addresses all review comments and re-requests review.", owner: "Developer", duration: "varies" },
      { order: 6, title: "Approve and merge", description: "Reviewer approves PR, developer merges to main branch.", owner: "Reviewer + Developer", duration: "5 min" },
    ],
  },
  {
    id: "incident-response",
    title: "Incident response",
    description: "P0/P1/P2 escalation + postmortem",
    category: "engineering",
    icon: "alert-triangle",
    steps: [
      { order: 1, title: "Detect and report", description: "Incident detected via monitoring alert or user report. Create incident ticket immediately.", owner: "On-call Engineer", duration: "5 min" },
      { order: 2, title: "Assess severity", description: "Classify as P0 (site down), P1 (major feature broken), or P2 (minor issue).", owner: "Team Lead", duration: "5 min" },
      { order: 3, title: "Assemble response team", description: "P0: whole team + CTO. P1: 2 engineers + TL. P2: 1 engineer.", owner: "Team Lead", duration: "10 min" },
      { order: 4, title: "Communicate ETA", description: "Post update in #incidents Slack channel with ETA for fix.", owner: "Team Lead", duration: "5 min" },
      { order: 5, title: "Investigate root cause", description: "Engineers dig into logs, traces, and recent deployments to find root cause.", owner: "Engineers", duration: "30–60 min" },
      { order: 6, title: "Deploy fix", description: "Apply fix, deploy to production, verify resolution.", owner: "Engineer", duration: "varies" },
      { order: 7, title: "Confirm resolution", description: "Monitor for 15 min after fix. Confirm incident resolved in Slack.", owner: "On-call Engineer", duration: "15 min" },
      { order: 8, title: "Write postmortem", description: "Document what happened, root cause, impact, and steps to prevent recurrence.", owner: "Team Lead", duration: "60 min" },
      { order: 9, title: "Action items", description: "Assign preventive action items to team members with due dates.", owner: "Manager", duration: "30 min" },
    ],
  },
  {
    id: "sprint-planning",
    title: "Sprint planning + retro",
    description: "Backlog grooming → daily standups → retrospective",
    category: "engineering",
    icon: "refresh",
    steps: [
      { order: 1, title: "Backlog grooming", description: "Product owner and TL review backlog, clarify requirements, and prioritize.", owner: "PM + TL", duration: "60 min" },
      { order: 2, title: "Sprint planning meeting", description: "Team picks stories from backlog, assigns story points, sets sprint goal.", owner: "Whole Team", duration: "90 min" },
      { order: 3, title: "Daily standup", description: "Each member shares: done, doing, blocker. TL removes blockers immediately.", owner: "Whole Team", duration: "15 min/day" },
      { order: 4, title: "Mid-sprint check", description: "TL reviews sprint progress at midpoint. Adjust if needed.", owner: "Team Lead", duration: "30 min" },
      { order: 5, title: "Sprint review", description: "Team demos completed work to stakeholders.", owner: "Whole Team", duration: "60 min" },
      { order: 6, title: "Retrospective", description: "Discuss: what went well, what didn't, what to improve next sprint.", owner: "Whole Team", duration: "45 min" },
      { order: 7, title: "Action items from retro", description: "Assign improvement actions to owners with due dates.", owner: "Team Lead", duration: "15 min" },
    ],
  },
  {
    id: "lead-qualification",
    title: "Lead qualification",
    description: "Discovery call → scoring → handoff to sales",
    category: "sales",
    icon: "user-check",
    steps: [
      { order: 1, title: "Lead capture", description: "Lead comes in via website form, LinkedIn, or referral. Log in CRM immediately.", owner: "SDR", duration: "5 min" },
      { order: 2, title: "Initial research", description: "Research company size, industry, tech stack, and pain points before reaching out.", owner: "SDR", duration: "15 min" },
      { order: 3, title: "First outreach", description: "Send personalized email or LinkedIn message. Follow up twice if no response.", owner: "SDR", duration: "10 min" },
      { order: 4, title: "Discovery call", description: "30-min call to understand budget, authority, need, and timeline (BANT).", owner: "SDR", duration: "30 min" },
      { order: 5, title: "Score and qualify", description: "Score lead based on BANT. Qualified leads pass to Account Executive.", owner: "SDR", duration: "10 min" },
      { order: 6, title: "Handoff to AE", description: "SDR briefs AE on lead context, pain points, and next steps.", owner: "SDR + AE", duration: "20 min" },
    ],
  },
  {
    id: "client-onboarding",
    title: "Client onboarding",
    description: "Contract signed → kickoff → delivery setup",
    category: "sales",
    icon: "briefcase",
    steps: [
      { order: 1, title: "Contract signing", description: "Legal and finance finalize contract. Client signs. Invoice sent.", owner: "Sales + Legal", duration: "1–3 days" },
      { order: 2, title: "Internal kickoff", description: "Sales briefs delivery team on client goals, timeline, and scope.", owner: "Sales + PM", duration: "30 min" },
      { order: 3, title: "Client kickoff call", description: "Introduce team, align on goals, set expectations for communication and delivery.", owner: "PM + Sales", duration: "60 min" },
      { order: 4, title: "Setup project tools", description: "Create Jira project, Slack channel, shared Google Drive, and document templates.", owner: "PM", duration: "30 min" },
      { order: 5, title: "Define milestones", description: "Set clear milestones with dates and deliverables. Client approves.", owner: "PM + Client", duration: "45 min" },
      { order: 6, title: "Share access", description: "Client gets access to project dashboard, status reports, and communication channels.", owner: "PM", duration: "15 min" },
      { order: 7, title: "Week 1 check-in", description: "Quick sync to confirm everything is on track and address early questions.", owner: "PM", duration: "30 min" },
      { order: 8, title: "Ongoing reporting", description: "Weekly status report sent every Friday with progress, blockers, and next week plan.", owner: "PM", duration: "30 min/week" },
    ],
  },
  {
    id: "expense-reimbursement",
    title: "Expense reimbursement",
    description: "Submit → approve → finance processing",
    category: "finance",
    icon: "receipt",
    steps: [
      { order: 1, title: "Collect receipts", description: "Employee collects all receipts. Photographs them clearly.", owner: "Employee", duration: "10 min" },
      { order: 2, title: "Fill expense form", description: "Employee fills reimbursement form with amount, date, and business justification.", owner: "Employee", duration: "15 min" },
      { order: 3, title: "Manager approval", description: "Manager reviews and approves or rejects with reason within 2 business days.", owner: "Manager", duration: "10 min" },
      { order: 4, title: "Finance verification", description: "Finance team verifies receipts match form, checks policy limits.", owner: "Finance", duration: "30 min" },
      { order: 5, title: "Process payment", description: "Finance processes reimbursement in next payroll cycle or via direct transfer.", owner: "Finance", duration: "1–5 days" },
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "hr", label: "HR" },
  { id: "engineering", label: "Engineering" },
  { id: "sales", label: "Sales" },
  { id: "operations", label: "Operations" },
  { id: "finance", label: "Finance" },
] as const;