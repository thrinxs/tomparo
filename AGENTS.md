<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# TOMPARO — AI Career & Job Application Platform

## Project Overview

TomParo is an AI-powered career intelligence platform that helps job seekers get hired faster and helps recruiters hire smarter. Built with Next.js 16, Tailwind CSS v4, Prisma 6, Supabase PostgreSQL, and multi-provider AI failover system.

**Live URL:** https://www.tomparo.com  
**GitHub:** https://github.com/thrinxs/tomparo  
**Built by:** Thrinxs (https://thrinxs.com)  
**Founder:** Josh Gold

---

## Tech Stack

- **Framework:** Next.js 16.2.10 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (uses `@import "tailwindcss"` not `@tailwind`)
- **Database:** PostgreSQL via Supabase (cloud, production-ready)
- **ORM:** Prisma 6 (stable, well-documented, NextAuth compatible)
- **AI Providers (7-provider failover system):**
  - Groq (llama-3.3-70b-versatile) — 14,400/day FREE
  - Cerebras (llama-3.3-70b) — 8,000/day FREE
  - Google Gemini 2.5 Flash — 250/day FREE
  - Google Gemini 2.5 Flash Lite — 1,000/day FREE
  - Mistral Large — 5,000/day FREE
  - OpenRouter (Llama 3.3) — 5,000/day FREE
  - HuggingFace (Llama 3.3) — 1,000/day FREE
  - **Combined: 34,650+ requests/day FREE**
- **Auth:** NextAuth.js (JWT strategy, credentials + Google)
- **Payments:** Paystack (Nigerian payments, INTEGRATED and WORKING)
- **Email Service:** Resend (INTEGRATED — sends from hire@tomparo.com)
- **File Storage:** Supabase Storage (CVs stored in `cvs` bucket)
- **Live Chat:** Tawk.to (INTEGRATED and WORKING)
- **Markdown:** react-markdown + remark-gfm (for AI Chat premium formatting)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Document Generation:** docx + file-saver (for DOCX downloads)
- **PDF Parsing:** pdf2json
- **DOC/DOCX Parsing:** mammoth
- **ZIP Processing:** adm-zip (for bulk CV upload)
- **File Upload:** react-dropzone
- **Notifications:** react-hot-toast + Toaster in root layout
- **State Management:** Zustand
- **Password Hashing:** bcryptjs
- **Supabase JS Client:** @supabase/supabase-js (for Storage)
- **Deployment:** Vercel (with auto-deploy from GitHub main branch)

---

## Project Structure

tomparo/
├── app/ # All pages and API routes
│ ├── page.tsx # Landing page
│ ├── layout.tsx # Root layout (Navbar + Footer + SessionProvider + TawkChat + CookieBanner + Toaster)
│ ├── globals.css # Tailwind v4 CSS entry with markdown styles
│ ├── not-found.tsx # Custom 404 page
│ ├── (auth)/ # Auth pages (own layout, no navbar)
│ │ ├── layout.tsx
│ │ ├── signin/page.tsx # WORKING — toggle + password visibility + keep me signed in
│ │ ├── signup/page.tsx # WORKING — toggle + password visibility
│ │ └── forgot-password/page.tsx
│ ├── (dashboard)/ # User dashboard (sidebar layout)
│ │ ├── layout.tsx
│ │ └── dashboard/
│ │ ├── DashboardClient.tsx # Client component split
│ │ ├── page.tsx # Dashboard home (WORKING)
│ │ ├── resume/page.tsx # CV analysis (WORKING)
│ │ ├── job/page.tsx # Job matching (WORKING)
│ │ ├── apply/page.tsx # Cover letter + email (WORKING)
│ │ ├── skills/page.tsx # Skill gap analysis (WORKING)
│ │ ├── interview/page.tsx # Interview coach (Premium)
│ │ ├── career/page.tsx # Career AI (Premium)
│ │ ├── chat/page.tsx # AI Chat with markdown (Premium)
│ │ ├── messages/page.tsx # Support center via Tawk.to (Premium)
│ │ ├── history/page.tsx # History with tabs (WORKING)
│ │ └── settings/page.tsx # Settings (WORKING)
│ ├── (recruiter)/ # Recruiter dashboard (purple sidebar layout)
│ │ ├── layout.tsx # RecruiterSidebar + RecruiterTopbar
│ │ └── recruiter/
│ │ ├── page.tsx # Recruiter dashboard home (WORKING)
│ │ ├── upload/page.tsx # Individual CV upload + AI analysis (WORKING)
│ │ ├── bulk/page.tsx # Bulk ZIP upload + CV selection + AI analysis (WORKING)
│ │ ├── talent-pool/page.tsx # TalentPool — applications inbox (WORKING)
│ │ ├── jobs/
│ │ │ ├── page.tsx # Job postings list (WORKING)
│ │ │ ├── new/page.tsx # Create job with AI write/review (WORKING)
│ │ │ └── [id]/edit/page.tsx # Edit job (WORKING)
│ │ ├── candidates/
│ │ │ ├── page.tsx # Candidate list + bulk email UI (WORKING)
│ │ │ └── [id]/page.tsx # Candidate detail + email panel + open tracking + history (WORKING)
│ │ ├── pipeline/page.tsx # Kanban pipeline (WORKING)
│ │ ├── emails/page.tsx # AI emails (PLANNED - Growth+)
│ │ ├── interviews/page.tsx # AI interviews (PLANNED - Business+)
│ │ ├── autopilot/page.tsx # AI autopilot (PLANNED - Enterprise+)
│ │ ├── analytics/page.tsx # Analytics (PLANNED - Business+)
│ │ └── settings/page.tsx # Recruiter settings — company profile + username + reply-to (WORKING)
│ ├── (admin)/
│ ├── (staff)/
│ ├── (support)/
│ ├── jobs/ # PUBLIC — candidate-facing pages
│ │ └── [companySlug]/
│ │ ├── page.tsx # Company jobs listing (WORKING)
│ │ └── [jobSlug]/
│ │ └── page.tsx # Job detail + AI match preview + apply form (WORKING)
│ ├── recruiter-pricing/page.tsx # Recruiter pricing — monthly/yearly toggle (WORKING)
│ ├── pricing/page.tsx # Consumer pricing (WORKING)
│ ├── privacy/page.tsx
│ ├── terms/page.tsx
│ ├── contact/page.tsx
│ ├── about/page.tsx
│ ├── how-it-works/page.tsx
│ ├── faq/page.tsx
│ ├── success-stories/page.tsx
│ └── api/
│ ├── auth/[...nextauth]/route.ts
│ ├── auth/signup/route.ts # WORKING — auto-generates companySlug on recruiter signup
│ ├── auth/forgot-password/route.ts
│ ├── resume/upload/route.ts
│ ├── resume/analyze/route.ts
│ ├── job/match/route.ts
│ ├── application/cover-letter/route.ts
│ ├── application/email/route.ts
│ ├── skills/analyze/route.ts
│ ├── interview/start/route.ts
│ ├── interview/evaluate/route.ts
│ ├── career/analyze/route.ts
│ ├── chat/route.ts
│ ├── payment/initialize/route.ts
│ ├── payment/verify/route.ts
│ ├── payment/webhook/route.ts
│ ├── user/profile/route.ts
│ ├── user/usage/route.ts
│ ├── user/history/route.ts
│ ├── track/email-open/[emailId]/route.ts # Email open tracking pixel (WORKING)
│ ├── jobs/ # PUBLIC — no auth required
│ │ └── [companySlug]/
│ │ ├── route.ts # GET company + active jobs
│ │ └── [jobSlug]/
│ │ ├── route.ts # GET single job
│ │ ├── apply/route.ts # POST application + CV upload to Supabase Storage
│ │ └── preview/route.ts # POST CV → instant AI match score
│ └── recruiter/
│ ├── cv/analyze/route.ts
│ ├── cv/analyze/jobs/[id]/route.ts
│ ├── bulk/route.ts
│ ├── bulk/analyze/route.ts
│ ├── jobs/route.ts # WORKING — auto-generates jobSlug on create
│ ├── jobs/[id]/route.ts
│ ├── jobs/generate/route.ts
│ ├── jobs/generate-field/route.ts
│ ├── jobs/review-field/route.ts
│ ├── candidates/route.ts
│ ├── candidates/[id]/route.ts
│ ├── talent-pool/route.ts # GET all applications
│ ├── talent-pool/[id]/route.ts # GET single + PATCH status + DELETE
│ ├── talent-pool/[id]/cv/route.ts # GET signed URL for CV preview/download
│ ├── emails/send/route.ts # POST send email via Resend + tracking pixel
│ ├── emails/generate/route.ts # POST AI generate email content
│ ├── emails/history/route.ts # GET email history
│ ├── emails/bulk/route.ts # POST bulk email to multiple candidates (Business+)
│ ├── settings/route.ts # GET + PATCH recruiter profile
│ └── slug/check/route.ts # GET check company username availability
├── components/
│ ├── Logo.tsx
│ ├── Footer.tsx # Hides on /recruiter/ (not /recruiter-pricing)
│ ├── CookieBanner.tsx # Cookie consent (WORKING — localStorage)
│ ├── SessionProvider.tsx
│ ├── TawkChat.tsx
│ ├── layout/
│ │ ├── Navbar.tsx
│ │ ├── DashboardSidebar.tsx
│ │ ├── DashboardTopbar.tsx
│ │ ├── RecruiterSidebar.tsx # Includes Talent Pool nav item
│ │ ├── RecruiterTopbar.tsx
│ │ ├── AdminSidebar.tsx
│ │ ├── StaffSidebar.tsx
│ │ └── SupportSidebar.tsx
│ ├── ui/
│ │ ├── Button.tsx
│ │ ├── Input.tsx
│ │ ├── Textarea.tsx
│ │ ├── Badge.tsx
│ │ ├── Spinner.tsx
│ │ ├── Progress.tsx
│ │ ├── GlowingCard.tsx
│ │ ├── GradientText.tsx
│ │ ├── ShimmerButton.tsx
│ │ ├── Spotlight.tsx
│ │ ├── Meteors.tsx
│ │ └── AnimatedNumber.tsx
│ ├── dashboard/
│ │ ├── LockedFeature.tsx
│ │ └── UsageCounter.tsx
│ ├── resume/
│ │ ├── ResumeUploader.tsx
│ │ └── ResumeAnalysis.tsx
│ ├── job/
│ │ ├── JobInput.tsx
│ │ └── JobAnalysis.tsx
│ ├── application/
│ │ ├── CoverLetter.tsx
│ │ └── EmailGenerator.tsx
│ ├── skills/
│ │ └── SkillGapSummary.tsx
│ ├── support/
│ ├── admin/
│ └── ads/
├── lib/
│ ├── prisma.ts
│ ├── gemini.ts
│ ├── auth.ts # Recruiter JWT flags always queried from DB
│ ├── utils.ts
│ ├── usage-limiter.ts
│ ├── paystack.ts
│ ├── email.ts # Resend client — sends from hire@tomparo.com — tracking pixel support
│ ├── supabase-storage.ts # Supabase Storage — uploadCV, getSignedUrl, deleteCV
│ └── ai/
│ ├── resume-analyzer.ts
│ ├── recruiter-cv-analyzer.ts
│ ├── recruiter-email-generator.ts # AI writes personalized recruiter emails
│ ├── job-description-generator.ts
│ ├── job-analyzer.ts
│ ├── application-generator.ts
│ ├── skill-gap-engine.ts
│ ├── interview-coach.ts
│ ├── career-intelligence.ts
│ ├── chat-assistant.ts
│ └── providers/
│ ├── gemini.ts
│ ├── groq.ts
│ ├── cerebras.ts
│ ├── mistral.ts
│ ├── openrouter.ts
│ └── huggingface.ts
├── types/
│ ├── index.ts
│ ├── user.ts
│ ├── resume.ts
│ ├── job.ts
│ └── ai.ts
├── hooks/
│ ├── useSession.ts
│ ├── useUsage.ts
│ ├── useResume.ts
│ └── useSubscription.ts
├── docs/
│ ├── recruiter-roadmap.md
│ ├── job-marketplace-vision.md
│ ├── opportunity-discovery.md
│ ├── monetization-strategy.md
│ └── job-discovery-feature.md
├── public/
│ └── images/
│ └── logo.png
├── prisma/
│ └── schema.prisma
├── proxy.ts
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── .env.local # NEVER commit

---

## Database Schema (Prisma)

### Consumer Tables

- **User** — id, name, email, phone, password, image, role, createdAt
- **Account** — NextAuth OAuth accounts
- **Session** — NextAuth sessions
- **VerificationToken** — NextAuth verification
- **Subscription** — plan, status, dates, Paystack ref
- **Resume** — userId, title, fileName, rawText, parsedData, atsScore
- **JobAnalysis** — userId, jobTitle, matchScore, analysis JSON
- **Application** — userId, type, content
- **InterviewSession** — userId, questions, answers, scores
- **UsageTracking** — userId, action, count, date
- **CareerInsight** — userId, analysis JSON
- **ChatConversation** — userId, title, createdAt
- **ChatMessage** — conversationId, role, content

### Recruiter Tables

- **RecruiterProfile** — userId, companyName, companySize, industry, website, logo, description, cvsUsedThisMonth, cvsResetDate, replyToEmail, companySlug (unique), slugLocked, slugChangeRequested
- **JobPosting** — recruiterId, jobSlug, title, description, requirements, location, type (enum), salaryMin, salaryMax, salaryCurrency, deadline, status (enum)
- **RecruiterCandidate** — recruiterId, jobId, fileName, rawText, candidateName, candidateEmail, candidatePhone, aiAnalysis (JSON), atsScore, status (enum), notes
- **RecruiterApplication** — recruiterId, jobId, candidateName, candidateEmail, candidatePhone, coverLetter, cvText, cvFileName, cvFileUrl (Supabase Storage path), aiAnalysis (JSON), atsScore, aiSummary, source (form/email), status (enum)
- **RecruiterEmail** — recruiterId, candidateId, type, to, subject, message, replyTo, ccSelf, hasAttachment, attachmentName, status, resendId, openedAt, openCount, createdAt

### Enums

- **JobType:** FULL_TIME, PART_TIME, CONTRACT, REMOTE, HYBRID
- **JobStatus:** DRAFT, ACTIVE, PAUSED, CLOSED
- **CandidateStatus:** NEW, REVIEWED, SHORTLISTED, REJECTED, HIRED
- **ApplicationStatus:** UNREAD, READ, SHORTLISTED, REJECTED, HIRED

---

## User Roles

- **GUEST** — No account, limited features, ads shown
- **FREE** — Basic account. Also used for recruiters who signed up but haven't paid yet. Gets 2 trial CV analyses.
- **PREMIUM** — Full features, unlimited, no ads (₦5,000/mo)
- **SUPPORT** — Customer care dashboard access
- **STAFF** — Internal staff dashboard access
- **ADMIN** — Full system access
- **RECRUITER_STARTER** — 20 CVs/mo, 3 job posts (₦5,000/mo)
- **RECRUITER_GROWTH** — 50 CVs/mo, 10 job posts (₦10,000/mo)
- **RECRUITER_BUSINESS** — 200 CVs/mo, 30 job posts (₦30,000/mo)
- **RECRUITER_ENTERPRISE** — 500 CVs/mo, Unlimited + Featured (₦80,000/mo)
- **RECRUITER_SCALE** — 1,000 CVs/mo, Unlimited + Priority (₦150,000/mo)
- **RECRUITER_CUSTOM** — Unlimited (custom pricing)

---

## Route Protection (proxy.ts)

- `/` `/pricing` `/recruiter-pricing` `/privacy` `/terms` `/contact` `/about` `/how-it-works` `/faq` `/success-stories` → Public
- `/jobs/*` → Public (candidate-facing apply pages)
- `/api/track/*` → Public (email open tracking pixel)
- `/signin` `/signup` `/forgot-password` → Auth (redirect if logged in, role-aware)
- `/dashboard/*` → Must be logged in. Recruiters redirected to `/recruiter`
- `/dashboard/interview` `/career` `/chat` `/messages` → LockedFeature for non-premium
- `/admin/*` → Admin only
- `/staff/*` → Staff + Admin
- `/support/*` → Support + Admin
- `/recruiter/*` (NOT `/recruiter-pricing`) → Recruiter roles + FREE users with RecruiterProfile

### Role-based redirect after sign in:

- ADMIN → /admin
- STAFF → /staff
- SUPPORT → /support
- RECRUITER\_\* → /recruiter
- FREE with isRecruiter=true → /recruiter
- FREE / PREMIUM → /dashboard

---

## Recruiter Platform — Feature Tiers

| Feature                            | Starter ₦5k | Growth ₦10k | Business ₦30k |   Enterprise ₦80k    |     Scale ₦150k      |
| ---------------------------------- | :---------: | :---------: | :-----------: | :------------------: | :------------------: |
| CVs / month                        |     20      |     50      |      200      |         500          |        1,000         |
| Free trial CVs (FREE role)         |      2      |      —      |       —       |          —           |          —           |
| Active job posts                   |      3      |     10      |      30       | Unlimited + Featured | Unlimited + Priority |
| TalentPool (applications inbox)    |     ✅      |     ✅      |      ✅       |          ✅          |          ✅          |
| Company username (apply email)     |     ✅      |     ✅      |      ✅       |          ✅          |          ✅          |
| Individual CV upload + AI analysis |     ✅      |     ✅      |      ✅       |          ✅          |          ✅          |
| AI candidate ranking               |     ✅      |     ✅      |      ✅       |          ✅          |          ✅          |
| Bulk ZIP upload                    |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| Duplicate CV detection             |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| Red flag detection                 |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| Verified employer badge            |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| Hiring pipeline (Kanban)           |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| Notes & ratings                    |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| AI rejection letter                |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| AI interview invite email          |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| AI hiring offer email              |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| AI follow-up & waitlist email      |     ❌      |     ✅      |      ✅       |          ✅          |          ✅          |
| Bulk email sending                 |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Email open tracking                |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Vacancy poster + social caption    |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Text interview                     |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Voice interview                    |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Video interview                    |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| AI generates questions             |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Per-answer AI scoring              |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Interview summary                  |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Interview recording                |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| AI hire recommendation             |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Watch live pipeline                |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| AI employment letter (PDF + DOCX)  |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| AI offer letter (PDF + DOCX)       |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Analytics dashboard                |     ❌      |     ❌      |      ✅       |          ✅          |          ✅          |
| Full autopilot mode                |     ❌      |     ❌      |      ❌       |          ✅          |          ✅          |
| Company branding on video          |     ❌      |     ❌      |      ❌       |          ✅          |          ✅          |
| AI NDA generation                  |     ❌      |     ❌      |      ❌       |          ✅          |          ✅          |
| Culture fit score                  |     ❌      |     ❌      |      ❌       |          ✅          |          ✅          |
| Featured job badge                 |     ❌      |     ❌      |      ❌       |          ✅          |          ✅          |
| Simultaneous autopilots            |     ❌      |     ❌      |      ❌       |          10          |      Unlimited       |
| Team seats                         |      1      |      2      |       5       |          10          |          25          |
| API access                         |     ❌      |     ❌      |      ❌       |          ❌          |          ✅          |
| White-label documents              |     ❌      |     ❌      |      ❌       |          ❌          |          ✅          |
| SLA guarantee                      |     ❌      |     ❌      |      ❌       |          ❌          |          ✅          |
| Dedicated account manager          |     ❌      |     ❌      |      ❌       |          ✅          |          ✅          |

---

## Recruiter AI Autopilot — Full Pipeline (Enterprise+)

Stage 1: Job Creation → Stage 2: CV Screening → Stage 3: Interview Invite → Stage 4: AI Interviews → Stage 5: Recommendation → Stage 6: Communications → Stage 7: Documents

- Recruiter can PAUSE any stage at any time
- AI never proceeds past Stage 5 without recruiter approval (unless full autopilot enabled)
- Candidates receive PDF; recruiter receives PDF + editable DOCX
- Full audit trail saved

---

## Key Technical Decisions

### Multi-Provider AI Failover System (WORKING)

**The correct AI functions (CRITICAL):**

- generateJSONWithGemini<T>(prompt, taskType) — for all structured JSON responses
- generateWithGemini(prompt) — for plain text responses
- NEVER use callAI or generateWithAI — these do NOT exist

**Task routing:**

- CV Analysis/Job Match/Career: Gemini Flash → Gemini Lite → Groq → Cerebras → Mistral → OpenRouter → HuggingFace
- Chat: Groq → Cerebras → Gemini Lite → Gemini Flash
- Recruiter CV / Job Description: generateJSONWithGemini with "general" or "cv-analysis"

**API keys required:**

- GEMINI_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY (NOT CELEBRAS), MISTRAL_API_KEY, OPENROUTER_API_KEY, HUGGINGFACE_API_KEY

### Company Username (Apply Email) System

- Every recruiter gets a unique `companySlug` (e.g. `thrinxs`)
- Their apply email is `thrinxs-apply@tomparo.com`
- Auto-generated from companyName on signup
- Recruiter can change it freely until first confirmation
- After confirmation: requires government ID + management staff card via support
- Availability check API: `GET /api/recruiter/slug/check?slug=xxx&excludeId=profileId`
- Stored in `RecruiterProfile.companySlug` (unique)
- `slugLocked` boolean prevents further changes

### TalentPool (Applications Inbox)

- Lives at `/recruiter/talent-pool`
- Shows ALL incoming applications from:
  - Apply form (`/jobs/[companySlug]/[jobSlug]`)
  - Email (future — inbound webhook)
- AI auto-analyses every CV on submission
- Auto-ranks by ATS score + hire recommendation
- Status: UNREAD → READ (auto on expand) → SHORTLISTED / REJECTED → HIRED
- CV files stored in Supabase Storage, preview + download via signed URLs
- Signed URLs expire after 1 hour (security)

### Public Apply Form (/jobs/[companySlug]/[jobSlug])

- Fully public — no auth required
- Step 1: View job details
- Step 2: Upload CV → AI instantly calculates match score vs job description
- Step 3: Candidate sees match % + matched skills + missing skills + tips
- Step 4: Fill form (name, email, phone, cover letter)
- Step 5: Submit → lands in recruiter's TalentPool instantly
- Duplicate application check (same email + job = rejected)
- CV file uploaded to Supabase Storage (`cvs` bucket, private)
- Company jobs page at `/jobs/[companySlug]`

### Supabase Storage (CVs)

- Bucket: `cvs` (private)
- Path format: `{profileId}/{jobId}/{timestamp}_{filename}`
- Upload: `lib/supabase-storage.ts → uploadCV()`
- Preview/Download: signed URL via `getSignedUrl()` — expires 1 hour
- Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (service_role key, NOT anon key)
- API: `GET /api/recruiter/talent-pool/[id]/cv` → returns signed URL

### Email System (Resend)

- Emails sent FROM `hire@tomparo.com` (verified domain)
- Candidate replies go to recruiter's personal email (Reply-To header)
- CC self option — sends copy to recruiter's email
- File attachments supported (PDF/DOC/DOCX)
- Email history saved to `RecruiterEmail` table
- 5 email types: interview_invite, rejection, offer, followup, waitlist
- AI writes personalized content via `lib/ai/recruiter-email-generator.ts`
- Set in Settings: `replyToEmail` field on RecruiterProfile
- Env var: `RESEND_API_KEY`

### Email Open Tracking (Business+)

- 1×1 transparent PNG tracking pixel embedded in every recruiter email
- Pixel URL: `/api/track/email-open/[emailId]`
- On candidate open: `openedAt`, `openCount` (increment), `status = "opened"` updated in DB
- Silently fails — never breaks email delivery
- `/api/track/*` is a public route in proxy.ts (no auth required)
- Email history on candidate detail page shows: "✅ Opened X times · Last opened [date]"
- Status badge: **Opened** (emerald) / **Sent** (blue) / **Failed** (red)

### Bulk Email Sending (Business+)

- API: `POST /api/recruiter/emails/bulk`
- Plan-gated: RECRUITER_BUSINESS, RECRUITER_ENTERPRISE, RECRUITER_SCALE, RECRUITER_CUSTOM, ADMIN
- Maximum 50 candidates per bulk send
- AI personalizes each email individually if no custom message provided
- 200ms delay between sends to avoid Resend rate limiting
- Each email gets its own tracking pixel
- UI on candidates page: select mode → checkboxes → compose panel → email type + job title + AI write → send
- Results displayed inline: ✅ sent / ❌ failed per candidate
- Returns summary: { total, successful, failed }

### Yearly Pricing Toggle

- Recruiter pricing page has Monthly / Yearly toggle
- Yearly = monthly × 12 × 0.85 (15% discount)
- `billing` state + `getDisplayPrice()` helper in page component
- `yearlyPrice()` helper defined outside component

### Cookie Consent Banner

- Component: `components/CookieBanner.tsx`
- Appears after 1.5s delay on first visit
- Preference saved in `localStorage` key `tomparo-cookie-consent`
- Options: Accept All / Reject / Learn more (shows cookie categories)
- Added to root `app/layout.tsx`

### Auth Pages — New Features

- **Password visibility toggle** — Eye/EyeOff icon on all password fields (signin + signup)
- **Keep me signed in** — checkbox on signin, saves to localStorage
- Both pages have Job Seeker (blue) / Recruiter (purple) toggle

### Recruiter Settings Page (/recruiter/settings)

- Company Profile (name, size, industry, website, description)
- Company Username — live availability check, confirm button (saves independently)
- Email Reply Settings — reply-to email for candidate replies + CC copies
- Save Settings button — turns green + "Settings Saved!" for 3 seconds on success

### Next.js 16 — params is a Promise (CRITICAL)

Always await params in API routes:
// ✅ CORRECT
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;

### Prisma 6

- After schema changes: npx prisma db push → npx prisma generate → restart dev
- Use `env $(cat .env.local | grep -v '^#' | xargs) npx prisma db push`

### jobSlug on JobPosting

- Auto-generated from title on job creation
- Format: lowercase, hyphens, max 60 chars
- Used in public URL: `/jobs/[companySlug]/[jobSlug]`
- Update existing jobs: `UPDATE "JobPosting" SET "jobSlug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) WHERE "jobSlug" IS NULL;`

---

## Pricing Structure

### Consumer (B2C)

| Plan    | Price                   | Features                             |
| ------- | ----------------------- | ------------------------------------ |
| Guest   | Free                    | 2 CV analyses/day, basic tools, ads  |
| Free    | ₦0                      | 5 CV analyses/day, save history, ads |
| Premium | ₦5,000/mo or ₦50,000/yr | Unlimited, no ads, all features      |

### Recruiter (B2B) — ALL INCLUSIVE

| Plan       | Price       | CVs/Mo | Job Posts            | Yearly (15% off) |
| ---------- | ----------- | ------ | -------------------- | ---------------- |
| Starter    | ₦5,000/mo   | 20     | 3 active             | ₦51,000/yr       |
| Growth     | ₦10,000/mo  | 50     | 10 active            | ₦102,000/yr      |
| Business   | ₦30,000/mo  | 200    | 30 active            | ₦306,000/yr      |
| Enterprise | ₦80,000/mo  | 500    | Unlimited + Featured | ₦816,000/yr      |
| Scale      | ₦150,000/mo | 1,000  | Unlimited + Priority | ₦1,530,000/yr    |
| Custom     | Custom      | ∞      | Everything           | Negotiated       |

---

## Environment Variables (.env.local)

# Database (Supabase PostgreSQL)

DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# NextAuth

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated with openssl rand -base64 32>

# AI Providers

GEMINI*API_KEY=<Google AI Studio key>
GROQ_API_KEY=<starts with gsk*>
CEREBRAS*API_KEY=<starts with csk->
MISTRAL_API_KEY=<Mistral key>
OPENROUTER_API_KEY=<starts with sk-or-v1->
HUGGINGFACE_API_KEY=<starts with hf*>

# Paystack

NEXT*PUBLIC_PAYSTACK_PUBLIC_KEY=<pk_test* or pk*live*>
PAYSTACK*SECRET_KEY=<sk_test* or sk*live*>

# Resend (email service)

RESEND*API_KEY=<starts with re*>

# Supabase Storage

SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_KEY=<service_role key — NOT anon key>

# Tawk.to Live Chat

NEXT_PUBLIC_TAWK_PROPERTY_ID=<Tawk.to property ID>
NEXT_PUBLIC_TAWK_WIDGET_ID=<Tawk.to widget ID>

# Google OAuth (optional)

GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>

---

## Vercel Environment Variables

DATABASE_URL, DIRECT_URL, NEXTAUTH_URL, NEXTAUTH_SECRET,
GEMINI_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY, MISTRAL_API_KEY, OPENROUTER_API_KEY, HUGGINGFACE_API_KEY,
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY,
RESEND_API_KEY,
SUPABASE_URL, SUPABASE_SERVICE_KEY,
NEXT_PUBLIC_TAWK_PROPERTY_ID, NEXT_PUBLIC_TAWK_WIDGET_ID,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

---

## Commands

# Development

npm run dev
npm run build
npm run start
npm run lint

# Database

env $(cat .env.local | grep -v '^#' | xargs) npx prisma db push
env $(cat .env.local | grep -v '^#' | xargs) npx prisma generate
npx prisma studio

# Force clean rebuild

rm -rf .next && npm run dev

# Force overwrite a file via terminal

cat > path/to/file.ts << 'ENDOFFILE'
...content...
ENDOFFILE

# Git

git add .
git commit -m "message"
git push

# Supabase SQL — update jobSlugs for existing jobs

UPDATE "JobPosting" SET "jobSlug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) WHERE "jobSlug" IS NULL;

# Supabase SQL — upgrade user to recruiter

UPDATE "User" SET role = 'RECRUITER_STARTER' WHERE email = 'user@example.com';

# Supabase SQL — view all users

SELECT id, email, name, role, phone FROM "User";

# Supabase SQL — view recruiter profiles with slugs

SELECT id, "companyName", "companySlug", "replyToEmail", "cvsUsedThisMonth" FROM "RecruiterProfile";

# Supabase SQL — delete recruiter user

DELETE FROM "RecruiterApplication" WHERE "recruiterId" IN (SELECT id FROM "RecruiterProfile" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'user@example.com'));
DELETE FROM "RecruiterEmail" WHERE "recruiterId" IN (SELECT id FROM "RecruiterProfile" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'user@example.com'));
DELETE FROM "RecruiterCandidate" WHERE "recruiterId" IN (SELECT id FROM "RecruiterProfile" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'user@example.com'));
DELETE FROM "JobPosting" WHERE "recruiterId" IN (SELECT id FROM "RecruiterProfile" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'user@example.com'));
DELETE FROM "RecruiterProfile" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'user@example.com');
DELETE FROM "Account" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'user@example.com');
DELETE FROM "Session" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'user@example.com');
DELETE FROM "User" WHERE email = 'user@example.com';

---

## Current Build Status

### ✅ Completed & Working

**Landing & Marketing:**
Landing page, Consumer Pricing (monthly/yearly), Recruiter Pricing (monthly/yearly toggle + 15% discount), Privacy, Terms, Contact, About, How It Works, FAQ, Success Stories, Custom 404

**Authentication:**

- Sign up with Job Seeker / Recruiter toggle + password visibility toggle (WORKING)
- Sign in with toggle + password visibility + Keep me signed in (WORKING)
- Cookie consent banner (WORKING)
- Forgot password (UI ready, needs email service)
- NextAuth JWT sessions with recruiter flags

**Job Seeker Dashboard (All WORKING):**
CV upload + AI analysis, Job matching, Cover letter (DOCX), Application email (3 styles, DOCX), Skill gap analysis, Interview Coach (Premium), Career AI (Premium), AI Chat (Premium), Priority Support (Premium), History, Settings, Usage tracking

**Recruiter Platform — Phase 1 ✅ COMPLETE:**

- Recruiter signup (company info + auto-generated companySlug)
- Recruiter pricing page (6 plans + custom, monthly/yearly toggle)
- Recruiter dashboard home
- RecruiterSidebar with plan-aware locks + Talent Pool item
- Individual CV upload + AI hiring analysis
- Job postings list + create/edit with AI (Write All / Write field / Review field / Auto-fix)
- Candidate list + Candidate detail page (AI analysis + email panel + history)
- Send emails to candidates (AI writes, recruiter reviews, Resend delivers)
- Email reply settings (reply-to email, CC self)
- Company username system (availability check, confirm button, lock after save)
- Recruiter settings page

**Recruiter Platform — Phase 2 ✅ COMPLETE:**

- Bulk ZIP upload + CV selection UI
- Bulk AI analysis with progress bar
- AI ranking (automatic by ATS score + hire recommendation)
- Pipeline Kanban (drag & drop, visual column highlight on hover)

**Recruiter Platform — Phase 3 ✅ COMPLETE:**

- AI emails (interview invite, rejection, offer, followup, waitlist)
- Email settings (reply-to, CC self, attachments)
- Email history per candidate
- TalentPool — applications inbox with AI auto-analysis
- Public apply form with AI match preview
- CV file storage (Supabase Storage) + preview + download
- Email open tracking — 1×1 pixel, openedAt + openCount, "✅ Opened" badge in history
- Bulk email sending — select candidates, compose, AI personalize, send to up to 50, results display

### ⏳ Recruiter Phases Remaining

**Phase 4: Analytics & Team**

- Analytics dashboard (Business+), team seats, activity log

**Phase 5: AI Interviews**

- Text, voice, video interviews (Business+)
- AI question generation, scoring, recording, shareable links

**Phase 6: AI Autopilot (Enterprise+)**

- Full 7-stage autonomous pipeline
- AI documents (employment letter, offer letter, NDA) as PDF + DOCX

**Phase 7: Marketplace**

- Public /jobs listing, company profiles, candidate database search

**Future:**

- Career Compass (₦1,000/use, ₦200 for Premium)
- AI Vacancy Poster + social media caption
- Password reset with actual emails
- Auto Job Discovery (85%+ CV matches)
- WhatsApp notifications (Termii)
- Blog with career tips (SEO)

---

## Migration History

### Phase 3 Communication + Email Tracking + Bulk Email (Latest)

- Added Resend email service (lib/email.ts) with tracking pixel support
- Added Supabase Storage for CV files (lib/supabase-storage.ts)
- Added RecruiterEmail table for email history (with openedAt, openCount fields)
- Added RecruiterApplication table for TalentPool
- Added companySlug + slugLocked to RecruiterProfile
- Added jobSlug to JobPosting
- Added cvFileUrl to RecruiterApplication
- Built TalentPool page with CV preview/download
- Built public apply form with AI match score preview
- Built company jobs listing page
- Built email open tracking: 1×1 pixel at /api/track/email-open/[emailId]
- Built bulk email sending: /api/recruiter/emails/bulk (Business+ plan-gated)
- Updated candidates page with bulk email select UI + compose panel
- Updated candidate detail page with open tracking display in email history
- Added /api/track/\* as public route in proxy.ts
- Added CookieBanner component + Toaster to root layout
- Added password visibility toggle + keep me signed in to auth pages
- Added yearly pricing toggle (15% discount) to recruiter pricing page

### Recruiter Platform Added (Phase 1 + Phase 2)

- Added RecruiterProfile, JobPosting, RecruiterCandidate tables + enums
- Added (recruiter) route group with purple-themed layout
- auth.ts updated to always query DB for isRecruiter flag
- signup/signin pages updated with toggle
- proxy.ts updated with recruiter route protection
- adm-zip added for bulk ZIP processing
- Pipeline Kanban built with @dnd-kit

### From SQLite to PostgreSQL (Supabase)

- Changed provider, added @db.Text annotations

### From Prisma 7 to Prisma 6

- Downgraded for NextAuth adapter compatibility

### From Single AI Provider to Multi-Provider Failover

- 7 providers, task-based routing, 34,650+ req/day

---

## Vision

TomParo is building Nigeria's first AI-native job marketplace — connecting job seekers with employers through intelligent matching, career coaching, and autonomous hiring tools.

### Revenue Projections

- Year 1: ₦20M (~$13K)
- Year 2: ₦110M (~$73K)
- Year 3: ₦410M (~$275K)
- Year 5: ₦2B+ (~$1.3M+)

---

## Notes for Future Development

- **params is a Promise in Next.js 16:** Always `const { id } = await params` in API routes
- **AI function name:** Use `generateJSONWithGemini(prompt, taskType)` — NOT callAI or generateWithAI
- **Recruiter role check:** Always check both role AND isRecruiter
- **JWT refresh:** After role change in DB, user must sign out/in
- **Monthly CV quota:** Tracked in RecruiterProfile.cvsUsedThisMonth — resets monthly
- **FREE recruiters:** Get 2 trial CVs — cvLimits.FREE = 2
- **Business plan job limit:** 30 (not unlimited) — jobLimits.RECRUITER_BUSINESS = 30
- **jobSlug:** Auto-generated on job create — update existing with SQL if NULL
- **companySlug:** Auto-generated on recruiter signup — recruiter can change until locked
- **Supabase Storage:** Use service_role key NOT anon key — anon key can't upload to private buckets
- **CV signed URLs:** Expire after 1 hour — generate fresh on each view/download request
- **Resend:** Sends FROM hire@tomparo.com — Reply-To set to recruiter's personal email
- **TalentPool vs Candidates:** TalentPool = incoming applications; Candidates = uploaded CVs
- **adm-zip import:** `const AdmZip = (await import("adm-zip")).default`
- **AI returns arrays sometimes:** Always use toSafeString(value, field) helper
- **Prisma generate after schema changes:** Always run then restart dev server
- **File overwrites via terminal:** `cat > file << 'ENDOFFILE'`
- **rm -rf .next:** Fixes most mysterious build errors
- **CEREBRAS not CELEBRAS:** Must be CEREBRAS_API_KEY
- **useSearchParams needs Suspense:** Always wrap in Next.js 16
- **Root layout is sacred:** Never overwrite app/layout.tsx with other code
- **Toaster in root layout:** react-hot-toast Toaster added — toast() works everywhere
- **Cookie banner:** Uses localStorage key `tomparo-cookie-consent`
- **Keep me signed in:** Uses localStorage key `tomparo-keep-signed-in`
- **Password toggle:** Eye/EyeOff icon — controlled by showPassword state
- **Yearly pricing:** yearlyPrice helper defined OUTSIDE component — billing state INSIDE component
- **Footer hides on /recruiter/ (trailing slash):** NOT on /recruiter-pricing
- **Jobs pages are public:** /jobs/\* must return NextResponse.next() in proxy.ts before dashboard check
- **Duplicate applications:** Check by recruiterId + jobId + candidateEmail before creating
- **toSafeString helper:** Convert AI field output — AI may return array instead of string
- **Email open tracking:** 1×1 pixel at /api/track/email-open/[emailId] — public route, no auth
- **Email tracking pixel:** Always created BEFORE sending email — emailRecord.id needed for URL
- **Bulk email max:** 50 candidates per request — 200ms delay between sends
- **Bulk email plan gate:** Business+ only — returns upgradeRequired: true for lower plans
- **Email status states:** "sent" → "opened" (on pixel fire) or "failed"
- **openCount increments:** Each pixel load = +1 — multiple opens tracked
