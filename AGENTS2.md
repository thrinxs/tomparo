# TOMPARO — AGENTS2.md

# Phase 6+ additions. Read AGENTS.md first for full context.

# This file covers everything built AFTER the last AGENTS.md update.

---

## New Environment Variables (add to .env.local + Vercel)

ELEVENLABS_API_KEY=sk_1dca1050e07343065f93501b65f32915230d99bbb89f89fd
ASSEMBLYAI_API_KEY=your_key_here

---

## New Files Added Since AGENTS.md

app/api/tts/route.ts # UPDATED — ElevenLabs → HuggingFace → Web Speech fallback chain
app/api/assemblyai/token/route.ts # NEW — generates short-lived AssemblyAI token for candidate page
app/api/interview-session/[token]/transcript/route.ts # NEW — candidate sends live transcript chunks to DB
app/api/recruiter/interviews/[id]/follow-up/route.ts # NEW — AI decides + generates follow-up question
app/api/recruiter/interviews/[id]/recording/route.ts # NEW — POST upload recording + GET signed URL
app/api/recruiter/interviews/[id]/go-live/route.ts # NEW — PATCH isLive + liveMessage
app/api/recruiter/interviews/[id]/live-transcript/route.ts # NEW — GET live transcript + PATCH stealth mode
app/api/recruiter/interviews/[id]/notes/route.ts # NEW — GET/POST/DELETE recruiter notes on interview
app/api/recruiter/interviews/[id]/rate/route.ts # NEW — PATCH per-question recruiter rating + flag
app/api/recruiter/interview-settings/route.ts # NEW — GET + PATCH global interview message template + defaultVoiceId
components/recruiter/InterviewMonitorModal.tsx # NEW — floating interview monitor modal

---

## Schema Changes (already pushed to DB)

### Added to RecruiterInterview:

voiceId String? — ElevenLabs voice ID for this interview
allowFollowUps Boolean @default(true)
followUpCount Int @default(0)
stealthMode Boolean @default(false) — recruiter watches without notifying candidate
liveTranscript String? @db.Text — live transcript from AssemblyAI (updated every second)
liveTranscriptUpdatedAt DateTime? — when transcript was last updated
notes RecruiterInterviewNote[] — relation to notes model

### Added to RecruiterInterviewQuestion:

isFollowUp Boolean @default(false)
parentQuestionId String? — ID of the main question this follows up on
followUpReason String? @db.Text — why AI decided to ask this follow-up
recruiterRating Int? — recruiter thumbs up (+1) or thumbs down (-1) per answer
flagged Boolean @default(false) — recruiter flags answer for review
recruiterNote String? @db.Text — recruiter private note per answer

### Added to RecruiterInterviewSettings:

defaultVoiceId String? — recruiter's default ElevenLabs voice ID

### New Model: RecruiterInterviewNote

id String @id @default(cuid())
interviewId String
recruiterId String
note String @db.Text
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
Relations: interview (RecruiterInterview), recruiter (RecruiterProfile)

### Added to RecruiterProfile:

interviewNotes RecruiterInterviewNote[] — back-relation (REQUIRED by Prisma)

---

## TTS Failover Chain (UPDATED)

### Priority Order

1. ElevenLabs (best quality — Business+ plans)
   - Returns audio/mpeg
   - On quota exceeded → 402 response → falls back
2. HuggingFace TTS (decent quality — free, uses existing HUGGINGFACE_API_KEY)
   - Model: microsoft/speecht5_tts
   - Returns audio/flac
3. Web Speech API (robotic — always works, browser built-in)
   - Falls back when /api/tts returns 503

### /api/tts route behaviour

POST body: { text: string, voiceId: string }
- Tries ElevenLabs first (if voiceId + ELEVENLABS_API_KEY set)
- Falls back to HuggingFace (if HUGGINGFACE_API_KEY set)
- Returns 503 { error: "tts_unavailable", fallback: "web-speech" } if both fail
- Client (speakElevenLabs) throws on non-OK → doSpeak .catch() fires Web Speech

### doSpeak() — finish guard (CRITICAL)

Every doSpeak() call uses a `finished` boolean guard:
- Prevents double-fire when ElevenLabs fails partway and fallback also calls finish()
- Pattern: let finished = false; const finish = () => { if (finished) return; finished = true; ... }
- ALWAYS use this pattern in any future speak implementation

---

## AssemblyAI Real-Time Transcription System

### Why AssemblyAI (replaced Web Speech API)

Web Speech API was unreliable:
- Stopped randomly after ~60s
- Clicked between restarts
- Repeated questions infinitely
- Missed answers silently

AssemblyAI WebSocket:
- True continuous streaming
- Sub-300ms transcript latency
- 333 hours free streaming/month
- No credit card required
- Handles Nigerian English well

### How It Works

1. Candidate clicks Begin Interview
2. getUserMedia() → mic stream obtained
3. POST /api/assemblyai/token (sends shareToken → server validates → returns short-lived AAI token)
4. WebSocket opened: wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=xxx
5. AudioContext + ScriptProcessorNode converts Float32 → Int16 → sends to WebSocket
6. AssemblyAI returns PartialTranscript (shown in real-time) + FinalTranscript (saved)
7. FinalTranscript → POST /api/interview-session/[token]/transcript → saved to DB
8. Recruiter Monitor Modal polls DB every 1s → sees live transcript

### AssemblyAI Token Security

- ASSEMBLYAI_API_KEY is server-side only — never exposed to browser
- /api/assemblyai/token validates shareToken against DB before issuing AAI token
- AAI token expires in 3600 seconds (1 hour)
- Proxy route is public (no auth) — validated by shareToken instead

### Silence Detection (kept from before)

Still uses AudioContext + AnalyserNode alongside AssemblyAI:
- Silence detection runs in parallel with AssemblyAI WebSocket
- When FinalTranscript received → cancel repeat timer + reset isRepeatingRef
- Silence thresholds controlled by pace slider (paceFromSlider)

---

## ElevenLabs Voice System

### Plan-Based Voice Tier (CRITICAL)

STARTER + GROWTH → Web Speech API (browser built-in, robotic, free)
BUSINESS + ENTERPRISE + SCALE + CUSTOM + ADMIN → ElevenLabs (human-like, $5/mo)

Checked in:
- /api/recruiter/interviews/route.ts (on create — resolves voiceId based on plan)
- /api/interview-session/[token]/route.ts (returns voiceTier + voiceId to candidate page)
- /app/(recruiter)/recruiter/interviews/new/page.tsx (shows voice picker only if isElevenLabsPlan)
- /app/(recruiter)/recruiter/settings/page.tsx (shows voice picker only if isElevenLabsPlan)

### ElevenLabs Voice Library (all 21 voices)

Stored in lib/ai/interview-engine.ts as ELEVENLABS_VOICES array
Each entry: { id, name, desc, gender }

DEFAULT_MALE_VOICE_ID = "nPczCjzI2devNBz1zQrb" // Brian
DEFAULT_FEMALE_VOICE_ID = "EXAVITQu4vr4xnSDxMaL" // Sarah
DEFAULT_NEUTRAL_VOICE_ID = "SAz9YHcvj6GT2YYXdXww" // River

Full voice list:
Brian → nPczCjzI2devNBz1zQrb (male) Deep, Resonant and Comforting
Daniel → onwK4e9ZLuTAKqWW03F9 (male) Steady Broadcaster
George → JBFqnCBsd6RMkjVDRZzb (male) Warm, Captivating Storyteller
Eric → cjVigY5qzO86Huf0OWal (male) Smooth, Trustworthy
Chris → iP95p4xoKVk53GoZ742B (male) Charming, Down-to-Earth
Adam → pNInz6obpgDQGcFmaJgB (male) Dominant, Firm
Bill → pqHfZKP75CvOlQylNhV4 (male) Wise, Mature, Balanced
Roger → CwhRBWXzGAHq8TQ4Fs17 (male) Laid-Back, Casual, Resonant
Charlie → IKne3meq5aSn9XLyUdCD (male) Deep, Confident, Energetic
Will → bIHbv24MWmeRgasZH58o (male) Relaxed Optimist
Liam → TX3LPaxmHKxFdv7VOQHJ (male) Energetic, Social Media Creator
Sarah → EXAVITQu4vr4xnSDxMaL (female) Mature, Reassuring, Confident
Matilda → XrExE9yKIg1WjnnlVkGX (female) Knowledgable, Professional
Bella → hpp4J3VqNfWAUOO0d1Us (female) Professional, Bright, Warm
Jessica → cgSgspJ2msm6clMCkdW9 (female) Playful, Bright, Warm
Alice → Xb7hH8MSUJpSbSDYk0k2 (female) Clear, Engaging Educator
Laura → FGY2WhTYpPnrIDTdsKH5 (female) Enthusiast, Quirky Attitude
Lily → pFZP5JQG7iQjIQuC4Bku (female) Velvety Actress
River → SAz9YHcvj6GT2YYXdXww (neutral) Relaxed, Neutral, Informative

---

## Pace Slider System

Candidate sets pace on setup screen before interview starts.
Smooth 0–100 continuous range.

paceFromSlider(value: 0-100):
silenceRepeat: lerp(8000, 1200, t) // 8s (very patient) → 1.2s (very fast)
silenceSkip: lerp(14000, 2000, t) // 14s → 2s
speechRate: 0.72 → 1.15 // AI speech speed

Labels:
0-15 → Very Patient 🐢
16-35 → Relaxed
36-60 → Normal 🚶
61-80 → Brisk
81-100 → Fast 🏃

---

## Voice Call Interview — Setup Screen

For VOICE interviews, candidate sees:
1. Interview type card (Voice Call, with ElevenLabs badge if Business+)
2. Gender selection (auto-detected from name, always overridable)
3. Date of birth
4. Pace slider (smooth 0-100 with live stats + preview button)
5. Voice picker (ONLY shown for Business+ plans using ElevenLabs)
6. Tips (shows exact seconds from selected pace)
7. Begin Interview button

For TEXT interviews, candidate sees:
1. Interview type card (Text Interview)
2. Gender selection
3. Date of birth
4. Begin Interview button

---

## Follow-Up Question System

### How It Works

After candidate submits each MAIN question answer:
1. /api/recruiter/interviews/[id]/follow-up called with { questionId, answer, shareToken }
2. analyzeForFollowUp() — Gemini decides if follow-up is warranted
3. If yes → generateFollowUpQuestion() — Gemini writes natural follow-up
4. Follow-up saved to DB as RecruiterInterviewQuestion (isFollowUp=true, parentQuestionId=mainQ.id)
5. totalQuestions + 1, followUpCount + 1 on interview
6. Candidate sees/hears the follow-up before moving to next main question

### Rules
- Max 3 follow-ups per interview total
- Never follow up on a follow-up question
- Never follow up on a skipped question
- Short answers (<15 words) don't trigger follow-up analysis
- Silently fails — never breaks interview flow

---

## Interview Monitor Modal (components/recruiter/InterviewMonitorModal.tsx)

### Three Size States
- corner — small floating widget, draggable anywhere on screen
- maximized — full screen overlay (two-column layout)
- minimized — thin bar at bottom right (candidate name + timer + progress)

### Features
- Live transcript feed — polls /api/recruiter/interviews/[id]/live-transcript every 1s
- Interview timer — counts up from 0:00 from when modal opened
- Current question display — shows question recruiter is watching
- Questions progress list (full screen mode only)
- Quick message templates (full screen mode only)
- Go Live button — announces presence to candidate
- Stealth mode — watch without notifying candidate
- Announce Presence — exits stealth + goes live + sends announcement message
- End Live Session button
- Send message → AI reads aloud to candidate
- Voice dictation for messages
- Skip question button
- Repeat question button (populates message box with question text)
- Draggable in corner mode (mousedown + mousemove + mouseup)
- Pulsing red dot when live, grey when watching silently

### Stealth Mode Flow
1. Recruiter opens Monitor Modal → clicks "Go Stealth"
2. PATCH /api/recruiter/interviews/[id]/live-transcript { stealthMode: true }
3. isLive stays FALSE — candidate NOT notified
4. Recruiter watches live transcript in real time
5. When ready → clicks "Announce My Presence"
6. stealthMode set to false, isLive set to true
7. liveMessage sent: "Hi [Name]! Your interviewer has joined..."
8. Candidate sees banner + AI reads announcement aloud

---

## Interview Detail Page (app/(recruiter)/recruiter/interviews/[id]/page.tsx)

### Full Rebuild — What's Now There

Header:
- Breadcrumb navigation
- Monitor Interview button (opens InterviewMonitorModal)
- Manual refresh button (spin animation while refreshing)
- Auto-refresh every 30s when status = IN_PROGRESS
- Live alert banner (red pulsing dot when isLive = true)

Stats Bar (5 columns):
- Total Questions
- Answered
- Skipped
- Follow-ups
- Progress %

2-Column Layout:
- Left (2/3): AI Summary, Live panel, Recording player, Questions list
- Right (1/3): Candidate info, AI recommendation, pipeline actions, health indicator, score breakdown, timeline, share link, go live, complete, notes

Candidate Info Card (right sidebar):
- Avatar with initials + color
- Name, email, job title, location
- Type/Mode/Status badges
- Profile link + Email quick action

AI Recommendation + Pipeline (right sidebar, shows after completion):
- Recommendation badge (Strong Hire / Hire / Maybe / No Hire)
- Final score (X/100)
- Pipeline action buttons: Shortlist, Reject, Send Offer, Follow Up

Health Indicator:
- 🟢 Strong Performance (avgScore >= 7 AND progress >= 80%)
- 🟡 Average Performance (avgScore >= 5 AND progress >= 60%)
- 🔴 Weak Performance (below thresholds)

Score Breakdown (by question type):
- CV Verification avg score + progress bar
- Location Based avg score + progress bar
- Job Specific avg score + progress bar
- Behavioural avg score + progress bar
- Color coded: green ≥8, amber ≥5, red <5

Interview Timeline:
- Created (always shown with date)
- Started (shown when startedAt set)
- Completed (shown when completedAt set)

Questions List (left column):
- Each main question shows: type badge, answered/skipped status, AI score (colored dot + X/10)
- Recruiter rating buttons per answer: 👍 (rating=1), 👎 (rating=-1)
- Flag button per answer (🚩) — highlights card with red ring
- Candidate answer + AI feedback per answered question
- Follow-up questions nested under parent with connector line
- Waiting/skipped states for unanswered questions
- Live answer entry (LIVE mode only) with dictation support

Notes (right sidebar, collapsible):
- Add private note textarea + save button
- Notes list with timestamp
- Delete note on hover (trash icon)
- Stored in RecruiterInterviewNote model

---

## Interviews List Page (app/(recruiter)/recruiter/interviews/page.tsx)

Full rebuild with:
- Live alert banner (red pulsing) when any interview isLive
- Stats bar: Total, Active, Completed, Avg Score
- Search by name/job/email
- Sort dropdown: Newest, Oldest, Highest score, Lowest score, Name A-Z
- Status tabs with counts: All, Pending, In Progress, Completed, Cancelled
- Bulk select + bulk delete
- Select all checkbox row
- Per-card: candidate avatar (initials + color), email, type badge (TEXT/VOICE/VIDEO), mode badge, follow-up count badge, time elapsed, progress bar, score (colored dot), recommendation badge, LIVE pulse
- Quick actions on hover: copy link, open, delete
- Empty states per status filter
- Refresh button with spin animation (refreshing state)
- fetchInterviews(isManual) — passes isManual to show spinner only on manual refresh

---

## Prisma Schema — Permanent Fix Strategy

### Problem
Python string replacement scripts silently fail when exact string not found.
sed with line numbers works but loses indentation on macOS.

### Permanent Solution for Adding Schema Fields
1. Find exact line number: grep -n "target_field" prisma/schema.prisma
2. Use sed to insert AFTER that line: sed -i '' 'NUMa\ field_name Type' prisma/schema.prisma
3. Fix indentation immediately: sed -i '' 's/^field_name/  field_name/' prisma/schema.prisma
4. Verify: sed -n 'NUM-2,NUM+4p' prisma/schema.prisma
5. Push: DATABASE_URL="..." DIRECT_URL="..." npx prisma db push

### Permanent Solution for Prisma TypeScript Errors
ALWAYS use: import { Prisma } from "@prisma/client"
Then type update data as: const data: Prisma.ModelNameUpdateInput = {}
Build data object by assigning fields conditionally — never spread conditionals.
This permanently prevents the union type mismatch error.

### DB Push When Local Network Fails
Local MacBook sometimes can't reach Supabase pooler (port 6543).
Use DIRECT_URL (port 5432) for migrations:
DATABASE_URL="$(grep DIRECT_URL .env.local | cut -d'"' -f2)" DIRECT_URL="$(grep DIRECT_URL .env.local | cut -d'"' -f2)" npx prisma db push

---

## Navbar Fix

app/components/layout/Navbar.tsx — hideNavbar conditions updated:
- pathname === "/recruiter" (exact match — was missing before, caused double navbar)
- pathname.startsWith("/recruiter/") && !pathname.startsWith("/recruiter-pricing")
- pathname.startsWith("/interview/") — hide on candidate interview pages
- All dashboard/admin/staff/support routes unchanged

---

## Current Build Status

### Phase 5 ✅ COMPLETE — AI Interviews

TEXT interviews: ✅ All working
VOICE interviews: ✅ AssemblyAI replaces Web Speech API for listening
TTS: ✅ ElevenLabs → HuggingFace → Web Speech fallback chain
Monitor Modal: ✅ Stealth mode, live transcript, draggable, 3 sizes
Interview Detail: ✅ Full rebuild with all features
Interviews List: ✅ Full rebuild with all features

### Known Limitations
- Voice interviews require HTTPS — test on tomparo.com not localhost
- AssemblyAI free tier: 333 hours streaming/month
- ElevenLabs free tier: 10,000 credits/month (exhausted during testing — top up $5)
- HuggingFace TTS is slower than ElevenLabs (~2-3s delay)
- Local Supabase connection may fail — use DIRECT_URL workaround

---

## ⏳ Next — Phase 6: AI Autopilot + Documents (Enterprise+)

- [ ] Full 7-stage autonomous pipeline
- [ ] AI employment letter (PDF + DOCX)
- [ ] AI offer letter (PDF + DOCX)
- [ ] AI NDA generation
- [ ] Extra HR documents: promotion, confirmation, probation, warning, termination, exit, experience, recommendation, internship letters
- [ ] HR policies generator
- [ ] Employee handbook generator
- [ ] AI performance review
- [ ] Hiring cost dashboard
- [ ] Culture fit score
- [ ] Featured job badge
- [ ] Pipeline action buttons on interview detail (Shortlist/Reject/Send Offer wired to actual API)
- [ ] Video interview candidate page UI (recording infra built, UI pending)
- [ ] Password reset emails (Resend — route exists, email not wired)

---

## Notes for Future Development

- **ASSEMBLYAI_API_KEY:** Server-side only. Proxy via /api/assemblyai/token. Never expose to browser.
- **AssemblyAI token route:** Public — no session auth. Validates by shareToken instead.
- **Live transcript flow:** AssemblyAI FinalTranscript → POST /api/interview-session/[token]/transcript → DB → recruiter modal polls every 1s
- **Stealth mode:** isLive stays false. Recruiter watches liveTranscript. Candidate unaware.
- **Announce presence:** Sets stealthMode=false + isLive=true + sends liveMessage in one operation.
- **Monitor modal size:** "corner" | "maximized" | "minimized" — state lives in modal component
- **Dragging:** Only works in corner mode. Uses mousedown/mousemove/mouseup on window.
- **Pipeline actions:** Currently UI only (buttons exist, API calls not wired). Wire in Phase 6.
- **RecruiterInterviewNote:** Always include back-relation on RecruiterProfile or Prisma will reject schema.
- **Prisma update types:** Always import Prisma from @prisma/client and use Prisma.ModelUpdateInput.
- **DB push locally:** Use DIRECT_URL (port 5432) not DATABASE_URL (port 6543/pgbouncer) for migrations.
- **Navbar double render:** Fixed. Must check pathname === "/recruiter" (exact) not just startsWith("/recruiter/").
- **Auto-refresh:** Interview detail page refreshes silently every 30s when IN_PROGRESS. Manual refresh shows spinner.
- **Score colors:** ≥8 = emerald, ≥5 = amber, <5 = red. Applied to dots, text, progress bars.
- **Health indicator:** Based on avgScore (scored questions only) AND progress %. Both must meet threshold.
- **Notes:** Private to recruiter. Not shown to candidate. Stored in RecruiterInterviewNote table.
- **Flagged answers:** Red ring on question card. Flag badge shown. Stored in RecruiterInterviewQuestion.flagged.
- **Recruiter rating:** +1 (thumbs up) or -1 (thumbs down) or null. Stored in recruiterRating field.
- **ElevenLabs quota:** 10K credits/month free. ~254 credits per question. Top up $5 for 30K credits.
- **HuggingFace TTS model:** microsoft/speecht5_tts with bdl speaker embedding (clear male English voice).
- **TTS Content-Type:** ElevenLabs returns audio/mpeg. HuggingFace returns audio/flac. Both play via Audio element.
