# TOMPARO — AGENTS2.md

# Phase 6+ additions. Read AGENTS.md first for full context.

# This file covers everything built AFTER the last AGENTS.md update.

---

## New Environment Variables (add to .env.local + Vercel)

ELEVENLABS_API_KEY=sk_1dca1050e07343065f93501b65f32915230d99bbb89f89fd

---

## New Files Added Since AGENTS.md

app/api/tts/route.ts # NEW — ElevenLabs TTS proxy (POST text+voiceId → returns audio/mpeg)
app/api/recruiter/interviews/[id]/follow-up/route.ts # NEW — AI decides + generates follow-up question (authenticated by shareToken)
app/api/recruiter/interviews/[id]/recording/route.ts # NEW — POST upload recording + GET signed URL
app/api/recruiter/interviews/[id]/go-live/route.ts # NEW — PATCH isLive + liveMessage
app/api/recruiter/interview-settings/route.ts # NEW — GET + PATCH global interview message template + defaultVoiceId

---

## Schema Changes (already pushed to DB)

### Added to RecruiterInterview:

voiceId String? — ElevenLabs voice ID for this interview
allowFollowUps Boolean @default(true)
followUpCount Int @default(0)

### Added to RecruiterInterviewQuestion:

isFollowUp Boolean @default(false)
parentQuestionId String? — ID of the main question this follows up on
followUpReason String? @db.Text — why AI decided to ask this follow-up

### Added to RecruiterInterviewSettings:

defaultVoiceId String? — recruiter's default ElevenLabs voice ID

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

### TTS Proxy (/api/tts)

POST body: { text: string, voiceId: string }
Returns: audio/mpeg binary stream
Uses: ELEVENLABS_API_KEY (server-side only — never exposed to browser)
Model: eleven_multilingual_v2
Settings: stability=0.45, similarity_boost=0.80, style=0.15, use_speaker_boost=true

### Failover Chain

ElevenLabs API fails → falls back to Web Speech API automatically
Web Speech API fails → silent (no crash)

### ElevenLabs Voice Library (all 21 voices)

Stored in lib/ai/interview-engine.ts as ELEVENLABS_VOICES array
Each entry: { id, name, desc, gender }

DEFAULT_MALE_VOICE_ID = "nPczCjzI2devNBz1zQrb" // Brian — Deep, Resonant and Comforting
DEFAULT_FEMALE_VOICE_ID = "EXAVITQu4vr4xnSDxMaL" // Sarah — Mature, Reassuring, Confident
DEFAULT_NEUTRAL_VOICE_ID = "SAz9YHcvj6GT2YYXdXww" // River — Relaxed, Neutral, Informative

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

## safeSpeak() — Chrome Freeze Fix (CRITICAL)

Chrome's speechSynthesis.onend sometimes never fires — causing the interview to freeze.
Fix is in safeSpeak() in app/interview/[token]/page.tsx:

- onend AND onerror both call finish() — first one wins
- Watchdog timer fires after estimated duration + buffer — forces progress
- Chrome resume hack — polls every 5s, calls speechSynthesis.resume() if paused
- 80ms delay before new utterance so cancel() settles cleanly
- Returns a cancel() function to stop speech on demand

NEVER call window.speechSynthesis.speak() directly in the interview page.
Always use doSpeak() which wraps safeSpeak() with proper state management.

---

## Pace Slider System

Candidate sets pace on setup screen before interview starts.
Smooth 0–100 continuous range (not 3 discrete buttons).

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

Live stats shown as slider drags:
"Wait before repeat: X.Xs"
"Skip after: Xs total"
"AI speed: X×"

Preview button plays a full sample sentence at current pace + selected voice.
Tips section updates dynamically to show exact seconds for current pace.

---

## Voice Call Interview — Setup Screen

For VOICE interviews, candidate sees:

1. Interview type card (Voice Call, with ElevenLabs badge if Business+)
2. Gender selection (auto-detected from name, always overridable)
3. Date of birth
4. Pace slider (smooth 0-100 with live stats + preview button)
5. Voice picker (ONLY shown for Business+ plans using ElevenLabs)
   - All 21 voices listed with name + description
   - ▶ preview button on each voice
   - Recruiter's default pre-selected, candidate can change
6. Tips (shows exact seconds from selected pace)
7. Begin Interview button

For TEXT interviews, candidate sees:

1. Interview type card (Text Interview)
2. Gender selection
3. Date of birth
4. Begin Interview button (no pace/voice — not relevant for text)

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

- Max 3 follow-ups per interview total (followUpCount >= 3 → skip)
- Never follow up on a follow-up question (isFollowUp === true → skip)
- Never follow up on a skipped question
- Short answers (<15 words) don't trigger follow-up analysis
- silently fails — never breaks interview flow (try/catch returns shouldAsk: false)

### analyzeForFollowUp() — When AI decides YES

Follow-up IS warranted:

- Candidate mentioned specific achievement, tool, technology, or project worth exploring
- Answer was vague where specifics would reveal true competence
- Candidate made interesting claim that deserves verification
- Key aspect could reveal much more about expertise

Follow-up is NOT warranted:

- Answer was already comprehensive and specific
- Question was already answered fully
- Answer revealed clear expertise without gaps

### generateFollowUpQuestion() — Natural language rules

- Never says "Follow-up question:"
- Starts with natural opener: "That's interesting...", "I see...", "You mentioned...", "Right, so..."
- References something SPECIFIC the candidate just said
- ONE focused question — not multiple
- Warm and encouraging tone
- Feels like natural conversation, not interrogation

### Follow-Up in VOICE interviews

- AI speaks follow-up naturally after main answer confirmed
- Same voice + pace as rest of interview
- Re-record and skip NOT available on follow-ups (prevents gaming)
- Follow-up shown with CornerDownRight icon + "Follow-up" label on question card

### Follow-Up in TEXT interviews

- After main answer submitted → API checked for follow-up
- "Checking..." spinner shown while API runs
- If follow-up: nested card appears below main question (indigo themed)
  with CornerDownRight icon and its own textarea + submit button
- After follow-up answered → "Great answer!" screen → Next Question button
- If no follow-up: "Answer received!" screen → Next Question button

### Recruiter Can Disable Follow-Ups

- Toggle on /recruiter/interviews/new — "AI Follow-Up Questions" switch
- allowFollowUps: false → skips the follow-up API call entirely
- Default: true

---

## Updated Files (since AGENTS.md)

### lib/ai/interview-engine.ts

Added:

- ELEVENLABS_VOICES — array of all 21 voice objects
- DEFAULT_MALE_VOICE_ID, DEFAULT_FEMALE_VOICE_ID, DEFAULT_NEUTRAL_VOICE_ID
- analyzeForFollowUp(input) → FollowUpDecision
- generateFollowUpQuestion(input) → FollowUpQuestion

### app/api/interview-session/[token]/route.ts

Now returns:

- voiceTier: "web-speech" | "elevenlabs" (based on recruiter plan)
- voiceId: resolved ElevenLabs voice ID (interview.voiceId || recruiter default || Brian)
- allowFollowUps: boolean
- followUpCount: number
- CV data from candidate OR application aiAnalysis

### app/api/recruiter/interviews/route.ts (POST)

Now accepts:

- allowFollowUps (boolean, default true)
- voiceId (string, only stored if elevenlabs plan + VOICE type)
  Resolves voiceId: interview.voiceId → recruiter defaultVoiceId → DEFAULT_MALE_VOICE_ID

### app/api/recruiter/interview-settings/route.ts

Now handles:

- defaultVoiceId field (GET returns it, PATCH saves it)

### app/interview/[token]/page.tsx

Full rewrite. Key changes:

- safeSpeak() with watchdog timer (fixes Chrome freeze)
- doSpeak() — uses ElevenLabs /api/tts if voiceTier=elevenlabs, falls back to Web Speech
- speakElevenLabs() — fetches audio blob from /api/tts, plays via Audio element
- speakWebSpeech() — Web Speech fallback with watchdog
- Smooth 0-100 pace slider with lerp() + live stats
- Voice picker (ElevenLabs voices, preview each)
- Follow-up handling in both VOICE and TEXT modes
- isFollowUpRef — tracks if current question is a follow-up
- followUpQuestionRef + followUpQuestionIdRef — stable refs to avoid stale closures
- checkFollowUp() — called after each main answer submission
- VoiceCallScreen — accepts isFollowUp + followUpQuestion props
- TextInterviewScreen — accepts pendingFollowUp, followUpAnswer, submittingFollowUp, followUpJustAnswered, onNextAfterFollowUp props
- All interview state uses refs for callbacks (prevents stale closure bugs)

### app/(recruiter)/recruiter/interviews/new/page.tsx

Added:

- Follow-up toggle (purple toggle switch, on by default)
- Voice picker (violet themed, shown only if isElevenLabsPlan + interviewType=VOICE)
- Preview button on each voice (calls /api/tts)
- Fetches recruiter plan from /api/user/profile
- Fetches global settings from /api/recruiter/interview-settings
- Passes allowFollowUps + voiceId to POST body

### app/(recruiter)/recruiter/settings/page.tsx

Added:

- defaultVoiceId state
- isElevenLabsPlan check (RECRUITER_BUSINESS+)
- ElevenLabs voice picker in Global Interview Template section (violet themed)
- Preview button on each voice (calls /api/tts, shows spinner while loading)
- Upgrade prompt for non-ElevenLabs plans
- defaultVoiceId saved to /api/recruiter/interview-settings on save

---

## Current Build Status — Phase 5 ✅ COMPLETE

### Phase 5 — AI Interviews — All Features

TEXT interviews:
✅ AI generates 10 questions (CV + location + job + behavioural)
✅ Per-answer AI scoring (0-10 + feedback)
✅ Final AI summary + hire recommendation + strengths + concerns
✅ Follow-up questions — nested card, max 3 total, silently fails
✅ Scores never shown to candidate
✅ Completion screen

VOICE interviews:
✅ ElevenLabs TTS (Business+ plans) — human-like voice
✅ Web Speech API fallback (Starter/Growth plans)
✅ Chrome freeze fix via safeSpeak() watchdog timer
✅ Smooth 0-100 pace slider with live stats
✅ Voice picker (21 ElevenLabs voices, preview each)
✅ AI reads opening message, each question, closing message
✅ SpeechRecognition captures candidate answers
✅ Silence detection (repeat after Xs, skip after Ys — pace-dependent)
✅ isRepeatingRef prevents repeat loop bug
✅ Confirm / Re-record per answer
✅ Follow-up questions spoken naturally by AI
✅ Full session MediaRecorder → auto-upload to Supabase recordings bucket
✅ Live takeover detection (polls every 3s)
✅ Recruiter live message read aloud to candidate

RECRUITER DASHBOARD:
✅ Go Live button (ASYNC → LIVE takeover)
✅ Live message panel (type or dictate)
✅ Recording player + download
✅ Skipped questions display
✅ Follow-up questions nested under parent in question list
✅ Interview type badge (Text=indigo, Voice=violet, Video=pink)
✅ AI scores visible to recruiter only

SETUP:
✅ Gender detection from name (200+ names inc. Nigerian)
✅ Candidate gender selection always overrides detection
✅ Date of birth
✅ Pace slider (voice only)
✅ Voice picker (Business+ voice interviews only)
✅ Recording consent notice

RECRUITER CONTROLS:
✅ allowFollowUps toggle on new/page.tsx
✅ Default voice picker in Settings (Business+ only)
✅ Global opening/closing/instructions in Settings
✅ Per-interview opening/closing/instructions on new/page.tsx

---

## ⏳ Next — Phase 6: AI Autopilot + Documents (Enterprise+)

- [ ] Full 7-stage autonomous pipeline
- [ ] AI employment letter (PDF + DOCX)
- [ ] AI offer letter (PDF + DOCX)
- [ ] AI NDA generation
- [ ] Extra HR documents: promotion, confirmation, probation, warning, termination, exit, experience, recommendation, internship letters
- [ ] HR policies generator (leave policy, remote work policy, code of conduct, attendance policy)
- [ ] Employee handbook generator (one-click)
- [ ] AI performance review
- [ ] Hiring cost dashboard (cost per hire, time to hire, offer acceptance rate)
- [ ] Culture fit score
- [ ] Featured job badge

---

## Notes for Future Development (Phase 5+)

- **ELEVENLABS_API_KEY:** Must be in .env.local + Vercel. Never expose to browser — always proxy via /api/tts
- **ElevenLabs plan check:** ELEVENLABS_PLANS = ["RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM", "ADMIN"]
- **Default male voice:** Brian — nPczCjzI2devNBz1zQrb
- **Default female voice:** Sarah — EXAVITQu4vr4xnSDxMaL
- **Voice resolution order:** interview.voiceId → recruiter interviewSettings.defaultVoiceId → DEFAULT_MALE_VOICE_ID
- **safeSpeak watchdog:** estimatedMs = max(3000, (text.length / 15) _ (1/rate) _ 1000 + 3000) — fires if onend never fires
- **Chrome resume hack:** setInterval every 5s calls speechSynthesis.resume() if paused — prevents Chrome 15s pause bug
- **doSpeak():** Always use this — never call safeSpeak or speakWebSpeech directly in controller
- **isRepeatingRef:** Set to true before repeat starts, false after — prevents silence detection loop firing multiple times
- **Shared mic stream:** startListeningForAnswer() reuses audioStreamRef.current for silence detection — no second getUserMedia call
- **paceFromSlider(0-100):** lerp between slow (0) and fast (100) — silenceRepeat, silenceSkip, speechRate all scale together
- **Follow-up silently fails:** /api/recruiter/interviews/[id]/follow-up always returns { shouldAsk: false } on any error — never breaks interview
- **Follow-up order:** stored as order = parentQuestion.order + 0.5 in DB
- **Follow-up in question list:** filter by !q.isFollowUp for main question list, nested display under parent for recruiter view
- **allowFollowUps:** checked at API level (interview.allowFollowUps) AND at UI level — both must be true
- **followUpCount limit:** 3 max per interview — checked in /api/recruiter/interviews/[id]/follow-up before any AI call
- **Text follow-up flow:** justAnswered=true → spinner → pendingFollowUp set → follow-up card appears → answered → followUpJustAnswered=true → next
- **Voice follow-up flow:** transcript confirmed → checkFollowUp() → if yes: setIsFollowUp(true) → doSpeak(followUpQuestion) → startListening
- **isFollowUpRef:** Must be a ref (not state) — used inside recognition callbacks which capture closure values
- **Recordings bucket:** Must be named exactly "recordings" in Supabase Storage — separate from "cvs" bucket
- **Recording auth:** POST /api/recruiter/interviews/[id]/recording uses x-share-token header (no session — candidate page sends it)
- **ElevenLabs model:** eleven_multilingual_v2 — best quality, handles Nigerian English well
- **Voice picker preview:** Calls /api/tts with voiceId → plays blob URL → sets previewingVoiceId to null on end
- **Voice cloning:** Planned for Scale plan — requires ElevenLabs Creator ($22/mo). Build separately when ready.
- **Google TTS:** Decided against — requires billing enabled even for free tier. ElevenLabs only.
- **Voice interview localhost:** SpeechRecognition + ElevenLabs both need HTTPS. Test voice interviews on tomparo.com only.
- **Pace slider tips:** Dynamically show exact seconds — "Silent for Xs → AI repeats" — updates as slider moves
- **Gender → voice mapping:** Candidate gender selection on setup screen → passed to handleSetupComplete → stored in genderRef → used by speakWebSpeech pitch (ElevenLabs doesn't need it — voiceId is explicit)
