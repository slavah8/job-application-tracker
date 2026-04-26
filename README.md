# Job Application Tracker

A full-stack portfolio app for tracking job applications, monitoring status changes, and manually syncing job-related Yahoo emails in a safe, read-only workflow.

The app is built to feel like a practical career tool: applications live in PostgreSQL, the dashboard loads from cached data, and email sync only runs when the user clicks **Sync Yahoo**.

## Why I Built This

Job searching creates a lot of scattered information: company names, roles, links, statuses, recruiter emails, rejections, interviews, and follow-ups. I built this project to practice production-style full-stack architecture while solving a real workflow problem.

The email system is intentionally provider-conscious. I use Yahoo Mail, so the app is not Gmail-specific. The current implementation uses Yahoo IMAP through `imapflow`, and the feature boundaries are designed so more providers can be added later.

## Features

- Create, edit, and delete job applications.
- Search by company or role.
- Filter applications by status.
- Track status history over time.
- Display polished status badges and summary cards.
- Manually sync the latest Yahoo inbox messages read-only.
- Store synced emails in PostgreSQL and display cached emails quickly.
- Sanitize email previews to remove raw headers, CSS, and HTML junk.
- Classify job emails as confirmation, pending/update, rejection, interview, or offer.
- Hide unrelated security, marketing, newsletter, social, school, and promo emails.
- Match job-related emails to existing applications.
- Auto-create applications from high-confidence unmatched job emails.
- Avoid duplicate applications through matching and normalized company/role checks.
- Keep hidden unrelated emails available in a secondary debug section.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Yahoo IMAP via `imapflow`
- Zod for form validation

## Screenshots

Add screenshots before publishing the repository:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/application-form.png`
- `docs/screenshots/recent-emails.png`
- `docs/screenshots/status-history.png`

## Architecture Overview

The app is organized by feature so each domain stays understandable:

- `src/features/applications`: application CRUD, validation, database access, and server actions.
- `src/features/email`: Yahoo sync, email storage, sanitization, classification, matching, and extraction.
- `src/components/dashboard`: dashboard UI sections.
- `src/components/ui`: reusable UI primitives and badges.
- `src/lib/prisma.ts`: shared Prisma client singleton.
- `prisma/schema.prisma`: database schema.

### Manual Tracker Flow

```text
Application form
-> server action
-> Prisma
-> PostgreSQL
-> dashboard
```

### Email Sync Flow

```text
Sync Yahoo button
-> read-only Yahoo IMAP
-> fetch latest-message sequence range
-> sanitize preview
-> store/dedupe emails
-> classify job signal
-> filter unrelated emails
-> match to applications
-> auto-create high-confidence unmatched applications
-> dashboard reads cached PostgreSQL data
```

The dashboard does not connect to Yahoo during normal page load. It reads cached PostgreSQL rows first, which keeps the UI fast.

## Yahoo IMAP Safety Notes

Yahoo sync is manual and read-only.

The app does not:

- Send emails.
- Delete emails.
- Move emails.
- Mark emails as read.
- Auto-update existing application statuses from emails.
- Log app passwords or full email bodies.

`EMAIL_SYNC_ENABLED` must be set to `true` before the Sync Yahoo button can run live IMAP sync.

## Email Classification, Matching, And Auto-Create

These responsibilities are intentionally separate:

- Classification decides whether an email is job-related and what signal it contains.
- Matching decides whether a job email belongs to an existing application.
- Extraction decides whether an unmatched job email is clear enough to create a new application.

This separation makes the code easier to reason about and reduces the risk of a weak email signal causing the wrong database change.

Auto-create only runs for high-confidence unmatched job emails. It requires a clear company, a clear role title, and duplicate checks before creating an application.

## Database Models

Main models:

- `Application`: company, role title, link, date applied, status, and notes.
- `ApplicationStatusHistory`: status transitions over time.
- `Email`: cached synced email metadata and cleaned preview text.
- `EmailAccount`, `SyncedEmail`, `EmailApplicationMatch`: provider-agnostic planning models for future email sync expansion.

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL running locally

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy the example file:

```powershell
Copy-Item .env.example .env
```

Use safe placeholder values from `.env.example`, then update `.env` locally:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/job_app_tracker?schema=public"
YAHOO_EMAIL_ADDRESS="your-yahoo-email@yahoo.com"
YAHOO_APP_PASSWORD="your-yahoo-app-password"
EMAIL_SYNC_ENABLED=false
```

Use a Yahoo app password, not your normal Yahoo password. Never commit `.env`.

### Prisma Setup

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate -- --name init
```

Seed demo data for screenshots:

```bash
npm run prisma:seed
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How To Use The App

1. Add applications manually from the dashboard.
2. Edit application status as the process changes.
3. Use search and status filters to narrow the dashboard.
4. Enable Yahoo sync in `.env` only when you want to test live email sync.
5. Click **Sync Yahoo** to fetch the latest inbox messages read-only.
6. Review classified emails, matches, and auto-created applications.
7. Use the hidden unrelated emails section to verify filtering behavior.

## Demo Seed Data

The seed script creates portfolio-friendly demo data:

- KBR - Junior Software Engineer - Interview
- Dover Fueling Solutions - Engineer, Software Intern - Rejected
- EYECARE for You - Office Assistant/Technician - Applied
- WHOOP - Software Engineer - Saved
- Invene - Junior Software Engineer - Applied

It also creates a few demo status history rows and fake demo emails. The demo emails do not contain private inbox content.

## Manual Verification Checklist

- Create a new application.
- Edit an application and confirm status history is recorded.
- Delete an application.
- Search by company or role.
- Filter by each status.
- Run `npm run prisma:seed` and confirm dashboard demo data appears.
- Keep `EMAIL_SYNC_ENABLED=false` and confirm live sync is disabled.
- Set `EMAIL_SYNC_ENABLED=true`, use a Yahoo app password, and click **Sync Yahoo**.
- Confirm Yahoo sync fetches cached emails without marking them as read.
- Confirm unrelated emails remain hidden by default.
- Confirm Dover-style rejection emails classify as rejection.
- Confirm KBR/EYECARE-style emails match or auto-create applications only when confidence is high.
- Click **Sync Yahoo** again and confirm duplicates are not created.

## Future Improvements

- Add authentication and per-user data.
- Add provider adapters for Outlook or generic IMAP.
- Add optional review/approval before auto-created applications are saved.
- Add pagination for large application lists.
- Add automated tests for classifier and matcher examples.
- Add background jobs for scheduled email sync.
- Add an AI-assisted classifier only for ambiguous emails, with explicit privacy controls.

## Portfolio / Interview Talking Points

- Designed a feature-based Next.js App Router architecture.
- Used Prisma and PostgreSQL for relational application and email data.
- Kept email sync provider-aware and Yahoo-compatible instead of Gmail-specific.
- Protected dashboard performance by separating cached reads from live IMAP sync.
- Built a rule-based classifier, matcher, and extractor as separate services.
- Added conservative duplicate prevention and high-confidence thresholds for auto-create.
- Preserved safety boundaries: read-only email sync, no email mutation, and no secrets in source control.
