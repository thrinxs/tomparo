"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams } from "next/navigation";
import {
  Mic, MicOff, Loader2, CheckCircle, AlertTriangle,
  Volume2, VolumeX, SkipForward, RotateCcw, Send,
  User, Calendar, ChevronRight, Star, MessageSquare,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const SILENCE_THRESHOLD = 8;        // audio level 0-255 below which = silence
const SILENCE_REPEAT_MS = 3000;     // 3s silence → repeat question
const SILENCE_SKIP_MS = 5000;       // 5s more → skip question
const POLL_INTERVAL_MS = 3000;      // live detection polling

// ── Common male/female name lists for voice selection ─────────────────────────
const MALE_NAMES = new Set([
  "james","john","robert","michael","william","david","richard","joseph","charles",
  "thomas","christopher","daniel","paul","mark","donald","george","kenneth","steven",
  "edward","brian","ronald","anthony","kevin","jason","matthew","gary","timothy",
  "jose","larry","jeffrey","frank","scott","eric","stephen","andrew","raymond",
  "gregory","joshua","jerry","dennis","walter","patrick","peter","harold","douglas",
  "henry","carl","arthur","ryan","roger","joe","juan","jack","albert","jonathan",
  "justin","terry","gerald","keith","samuel","willie","ralph","lawrence","nicholas",
  "roy","benjamin","bruce","brandon","adam","harry","fred","wayne","billy","steve",
  "louis","jeremy","aaron","randy","howard","eugene","carlos","russell","bobby",
  "victor","martin","ernest","phillip","todd","jesse","craig","alan","shawn",
  "clarence","sean","philip","chris","johnny","earl","jimmy","antonio","danny",
  "bryan","tony","luis","mike","stanley","leonard","nathan","dale","manuel",
  "rodney","curtis","norman","allen","marvin","vincent","glenn","jeffery","travis",
  "jeff","chad","jacob","lee","melvin","alfred","kyle","francis","bradley","jesus",
  "herbert","frederick","ray","joel","edwin","don","troy","henry","alan","barry",
  "alexander","bernard","mario","leo","angel","leroy","andres","brett",
  // Nigerian names
  "emeka","chidi","tunde","femi","seun","kunle","niyi","taiwo","kehinde","babatunde",
  "adewale","adebayo","oluwaseun","olumide","olusegun","chukwuemeka","ifeanyi",
  "obinna","chibuike","ugochukwu","kelechi","nnamdi","chinedu","ike","ikenna",
  "amara","eze","uche","uzoma","chukwuma","obi","emeka","chibundo","chisom",
]);

const FEMALE_NAMES = new Set([
  "mary","patricia","jennifer","linda","barbara","elizabeth","susan","jessica",
  "sarah","karen","lisa","nancy","betty","margaret","sandra","ashley","dorothy",
  "kimberly","emily","donna","michelle","carol","amanda","melissa","deborah",
  "stephanie","rebecca","sharon","laura","cynthia","kathleen","amy","angela",
  "shirley","anna","brenda","pamela","emma","nicole","helen","samantha","katherine",
  "christine","debra","rachel","carolyn","janet","catherine","maria","heather",
  "diane","julie","joyce","victoria","kelly","christina","joan","evelyn","lauren",
  "judith","olivia","frances","martha","cheryl","megan","andrea","hannah","jacqueline",
  "ann","jean","alice","kathryn","gloria","teresa","doris","sara","janice","julia",
  "marie","madison","grace","judy","theresa","beverly","denise","marilyn","amber",
  "danielle","brittany","diana","abigail","jane","lori","alexandria","kayla",
  // Nigerian names
  "ngozi","chioma","amaka","adaeze","adaora","nneka","chinwe","ifeoma","obiageli",
  "nkiruka","chinyere","ugochi","adanna","uju","ogechi","chizoba","amarachi",
  "tolani","folake","bimpe","sade","yetunde","gbemi","ronke","bisi","funke",
  "tope","kemi","wura","shade","bunmi","toyin","ade","abike","yinka","lola",
]);

function detectGenderFromName(name: string): "male" | "female" | null {
  const first = name.trim().split(" ")[0].toLowerCase();
  if (MALE_NAMES.has(first)) return "male";
  if (FEMALE_NAMES.has(first)) return "female";
  return null;
}

// ── Speech Synthesis ───────────────────────────────────────────────────────────
function getVoice(gender: "male" | "female" | "prefer-not-to-say"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const target = gender === "prefer-not-to-say" ? null : gender;

  const priority = target === "male"
    ? ["Google UK English Male", "Microsoft David", "Daniel", "Alex"]
    : target === "female"
    ? ["Google UK English Female", "Microsoft Zira", "Samantha", "Karen"]
    : [];

  for (const name of priority) {
    const found = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found;
  }

  // Fallback — search by gender keyword in voice name
  if (target) {
    const fallback = voices.find((v) =>
      v.name.toLowerCase().includes(target) && v.lang.startsWith("en")
    );
    if (fallback) return fallback;
  }

  // Last resort — any English voice
  return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

function speak(
  text: string,
  gender: "male" | "female" | "prefer-not-to-say",
  onEnd?: () => void
): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = gender === "male" ? 0.85 : gender === "female" ? 1.1 : 1.0;
  utter.volume = 1;
  const voice = getVoice(gender);
  if (voice) utter.voice = voice;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
  return utter;
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
}

// ── Setup Screen ───────────────────────────────────────────────────────────────
function SetupScreen({
  candidateName,
  jobTitle,
  companyName,
  interviewType,
  onStart,
}: {
  candidateName: string;
  jobTitle: string | null;
  companyName: string | null;
  interviewType: string;
  onStart: (gender: "male" | "female" | "prefer-not-to-say", dob: string) => void;
}) {
  const detected = detectGenderFromName(candidateName);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">(detected || "prefer-not-to-say");
  const [dob, setDob] = useState("");
  const [dobError, setDobError] = useState("");

  const handleStart = () => {
    if (!dob) { setDobError("Please enter your date of birth"); return; }
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365));
    if (age < 16 || age > 100) { setDobError("Please enter a valid date of birth"); return; }
    onStart(gender, dob);
  };

  const typeLabel = interviewType === "VOICE" ? "Voice Call" : interviewType === "VIDEO" ? "Video" : "Text";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Hi, {candidateName.split(" ")[0]}!
          </h1>
          <p className="text-slate-400 text-sm">
            {companyName} has invited you to a {typeLabel} interview
            {jobTitle ? ` for the ${jobTitle} position` : ""}.
          </p>
        </div>

        {/* Interview type info */}
        <div className={`rounded-2xl border p-4 text-center ${
          interviewType === "VOICE"
            ? "border-violet-500/20 bg-violet-500/5"
            : interviewType === "VIDEO"
            ? "border-pink-500/20 bg-pink-500/5"
            : "border-indigo-500/20 bg-indigo-500/5"
        }`}>
          {interviewType === "VOICE" && (
            <>
              <Mic className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">Voice Interview</p>
              <p className="text-xs text-slate-400">
                AI will read each question aloud. Speak your answers clearly.
                Allow microphone access when prompted.
              </p>
            </>
          )}
          {interviewType === "TEXT" && (
            <>
              <MessageSquare className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">Text Interview</p>
              <p className="text-xs text-slate-400">
                Read each question and type your answer. Take your time — there's no timer.
              </p>
            </>
          )}
        </div>

        {/* Gender */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-white">Your Gender</p>
            {detected && (
              <span className="text-[10px] text-slate-500 ml-auto">
                (detected from name — change if incorrect)
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["male", "female", "prefer-not-to-say"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`py-2.5 rounded-xl text-xs font-medium transition border ${
                  gender === g
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
                }`}
              >
                {g === "prefer-not-to-say" ? "Prefer not to say" : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          {interviewType === "VOICE" && (
            <p className="text-[10px] text-slate-500">
              This helps us match the AI voice to your preference.
            </p>
          )}
        </div>

        {/* Date of birth */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-white">Date of Birth</p>
          </div>
          <input
            type="date"
            value={dob}
            onChange={(e) => { setDob(e.target.value); setDobError(""); }}
            max={new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition"
          />
          {dobError && <p className="text-xs text-red-400">{dobError}</p>}
        </div>

        {/* Tips */}
        {interviewType === "VOICE" && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tips</p>
            {[
              "Find a quiet place with no background noise",
              "Speak clearly and at a normal pace",
              "If you go silent for 3 seconds, the question will be repeated",
              "After 8 more seconds of silence, the question will be skipped",
            ].map((tip) => (
              <p key={tip} className="text-xs text-slate-500 flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                {tip}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          Begin Interview <ChevronRight className="w-4 h-4" />
        </button>

        <p className="text-center text-[11px] text-slate-600">
          By starting, you consent to this interview being recorded for evaluation purposes.
        </p>
      </div>
    </div>
  );
}

// ── Voice Call UI ──────────────────────────────────────────────────────────────
function VoiceCallScreen({
  interview,
  currentIndex,
  isAISpeaking,
  isListening,
  transcript,
  silencePhase,
  onConfirm,
  onReRecord,
  onSkip,
  confirming,
  phase,
  liveJoined,
}: {
  interview: any;
  currentIndex: number;
  isAISpeaking: boolean;
  isListening: boolean;
  transcript: string;
  silencePhase: "none" | "warn" | "skip";
  onConfirm: () => void;
  onReRecord: () => void;
  onSkip: () => void;
  confirming: boolean;
  phase: string;
  liveJoined: boolean;
}) {
  const question = interview.questions[currentIndex];
  const answeredCount = interview.questions.filter((q: any) => q.answered || q.skipped).length;
  const progress = Math.round((answeredCount / interview.totalQuestions) * 100);

  if (phase === "opening" || phase === "closing") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-purple-400" />
            </div>
            {isAISpeaking && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-ping" />
                <span className="absolute inset-[-8px] rounded-full border border-purple-500/20 animate-ping" style={{ animationDelay: "0.3s" }} />
              </>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            {phase === "opening" ? "Your interview is starting..." : "Interview complete..."}
          </p>
          {isAISpeaking && (
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-purple-400 rounded-full animate-bounce"
                  style={{ height: `${12 + Math.random() * 16}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Interview Complete!</h2>
            <p className="text-slate-400 text-sm">
              Thank you, {interview.candidateName.split(" ")[0]}. Your responses have been recorded.
              The team will review them and be in touch soon.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm text-emerald-400 font-medium">
              {answeredCount} of {interview.totalQuestions} questions answered
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">

      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">AI Voice Interview</p>
            <p className="text-white font-semibold text-sm">{interview.jobTitle || "Interview"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {answeredCount} / {interview.totalQuestions}
            </p>
            <p className="text-white font-semibold text-sm">{progress}%</p>
          </div>
        </div>
        <div className="h-0.5 bg-white/5">
          <div
            className="h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full space-y-8">

        {/* Live joined banner */}
        {liveJoined && (
          <div className="w-full rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
            <p className="text-sm font-semibold text-blue-400">
              👤 Your interviewer has joined
            </p>
            <p className="text-xs text-slate-400 mt-1">
              A human interviewer has taken over. Continue as normal.
            </p>
          </div>
        )}

        {/* AI orb */}
        <div className="relative">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
            isAISpeaking
              ? "bg-purple-500/30"
              : isListening
              ? "bg-indigo-500/20"
              : "bg-white/5"
          }`}>
            {isAISpeaking ? (
              <Volume2 className="w-12 h-12 text-purple-400" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-indigo-400" />
            ) : (
              <VolumeX className="w-12 h-12 text-slate-600" />
            )}
          </div>

          {/* Pulse rings */}
          {(isAISpeaking || isListening) && (
            <>
              <span className={`absolute inset-0 rounded-full border-2 animate-ping ${
                isAISpeaking ? "border-purple-500/40" : "border-indigo-500/40"
              }`} />
              <span className={`absolute inset-[-12px] rounded-full border animate-ping ${
                isAISpeaking ? "border-purple-500/20" : "border-indigo-500/20"
              }`} style={{ animationDelay: "0.3s" }} />
            </>
          )}
        </div>

        {/* Status label */}
        <div className="text-center space-y-1">
          {isAISpeaking && (
            <>
              <p className="text-purple-400 font-semibold text-sm">AI is speaking...</p>
              <div className="flex items-center justify-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-purple-400 rounded-full animate-bounce"
                    style={{ height: "12px", animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </>
          )}
          {isListening && !isAISpeaking && (
            <>
              <p className="text-indigo-400 font-semibold text-sm">Listening...</p>
              {silencePhase === "warn" && (
                <p className="text-amber-400 text-xs animate-pulse">
                  Repeating question in a moment...
                </p>
              )}
              {silencePhase === "skip" && (
                <p className="text-red-400 text-xs animate-pulse">
                  No response — skipping in 5 seconds...
                </p>
              )}
            </>
          )}
          {!isAISpeaking && !isListening && !transcript && (
            <p className="text-slate-500 text-sm">Preparing next question...</p>
          )}
        </div>

        {/* Question text */}
        {question && (
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Question {currentIndex + 1} of {interview.totalQuestions}
            </p>
            <p className="text-white text-base font-medium leading-relaxed">
              {question.question}
            </p>
          </div>
        )}

        {/* Transcript */}
        {transcript && !isAISpeaking && (
          <div className="w-full space-y-3">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
              <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-2">
                Your Answer
              </p>
              <p className="text-white text-sm leading-relaxed">{transcript}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onReRecord}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-medium hover:text-white hover:bg-white/10 transition"
              >
                <RotateCcw className="w-4 h-4" /> Re-record
              </button>
              <button
                onClick={onConfirm}
                disabled={confirming}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {confirming
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
                  : <><Send className="w-4 h-4" />Confirm Answer</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Skip button */}
        {isListening && !transcript && (
          <button
            onClick={onSkip}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-medium hover:text-white transition"
          >
            <SkipForward className="w-3.5 h-3.5" /> Skip this question
          </button>
        )}

        {/* Question overview pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {interview.questions.map((q: any, i: number) => (
            <div
              key={q.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                q.answered
                  ? "bg-emerald-500/20 text-emerald-400"
                  : q.skipped
                  ? "bg-slate-500/20 text-slate-500"
                  : i === currentIndex
                  ? "bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/40"
                  : "bg-white/5 text-slate-600"
              }`}
            >
              {q.answered ? "✓" : q.skipped ? "—" : i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Text Interview UI (existing style) ────────────────────────────────────────
function TextInterviewScreen({
  interview,
  currentIndex,
  answer,
  setAnswer,
  onSubmit,
  submitting,
  onNext,
  justAnswered,
  setCurrentIndex,
  setJustAnswered,
  phase,
}: {
  interview: any;
  currentIndex: number;
  answer: string;
  setAnswer: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  onNext: () => void;
  justAnswered: boolean;
  setCurrentIndex: (i: number) => void;
  setJustAnswered: (v: boolean) => void;
  phase: string;
}) {
  const answeredCount = interview.questions.filter((q: any) => q.answered).length;
  const progress = Math.round((answeredCount / interview.totalQuestions) * 100);
  const currentQuestion = interview.questions[currentIndex];
  const allAnswered = interview.questions.every((q: any) => q.answered);

  const questionTypeLabels: Record<string, string> = {
    CV_VERIFICATION: "About Your Experience",
    LOCATION_BASED: "About Your Location",
    JOB_SPECIFIC: "About The Role",
    BEHAVIOURAL: "Behavioural",
  };

  if (phase === "complete" || allAnswered) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Interview Complete! 🎉</h2>
            <p className="text-slate-400 text-sm">
              Thank you, {interview.candidateName.split(" ")[0]}. Your responses have been submitted.
              The team will review them and be in touch soon.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm text-emerald-400 font-medium">
              {answeredCount} of {interview.totalQuestions} questions answered
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">AI Interview</p>
            <p className="text-white font-semibold">{interview.jobTitle || "Interview"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{answeredCount} / {interview.totalQuestions}</p>
            <p className="text-white font-semibold text-sm">{progress}%</p>
          </div>
        </div>
        <div className="h-1 bg-white/5">
          <div
            className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Hi, {interview.candidateName.split(" ")[0]}!
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Answer each question thoughtfully. Take your time — there's no timer.
          </p>
        </div>

        {currentQuestion && !currentQuestion.answered && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {questionTypeLabels[currentQuestion.questionType] || currentQuestion.questionType}
              </span>
              <span className="text-xs text-slate-600">
                Question {currentIndex + 1} of {interview.totalQuestions}
              </span>
            </div>
            <p className="text-white text-lg font-medium leading-relaxed">
              {currentQuestion.question}
            </p>

            {justAnswered ? (
              <div className="space-y-4">
                <div className="text-center p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-semibold">Answer received!</p>
                  <p className="text-slate-400 text-sm mt-1">Moving to the next question.</p>
                </div>
                <button
                  onClick={onNext}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition text-sm"
                />
                <button
                  onClick={onSubmit}
                  disabled={submitting || !answer.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition disabled:opacity-50"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
                    : <><Send className="w-4 h-4" />Submit Answer</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">All Questions</p>
          <div className="space-y-2">
            {interview.questions.map((q: any, i: number) => (
              <div
                key={q.id}
                onClick={() => { if (!q.answered) { setCurrentIndex(i); setJustAnswered(false); } }}
                className={`flex items-center gap-3 p-3 rounded-xl transition cursor-pointer ${
                  i === currentIndex && !q.answered
                    ? "bg-purple-500/10 border border-purple-500/20"
                    : q.answered
                    ? "bg-emerald-500/5 border border-emerald-500/10"
                    : "bg-white/[0.02] border border-white/5 hover:bg-white/5"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  q.answered ? "bg-emerald-500/20 text-emerald-400"
                  : i === currentIndex ? "bg-purple-500/20 text-purple-400"
                  : "bg-white/5 text-slate-500"
                }`}>
                  {q.answered ? "✓" : i + 1}
                </div>
                <p className="text-sm text-slate-300 truncate flex-1">{q.question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Session Controller ────────────────────────────────────────────────────
function InterviewSession() {
  const params = useParams();
  const token = params.token as string;

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Setup screen
  const [setupDone, setSetupDone] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">("prefer-not-to-say");

  // Interview flow
  const [phase, setPhase] = useState<"opening" | "interview" | "closing" | "complete">("opening");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Voice mode state
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [silencePhase, setSilencePhase] = useState<"none" | "warn" | "skip">("none");
  const [confirming, setConfirming] = useState(false);
  const [liveJoined, setLiveJoined] = useState(false);

  // Text mode state
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justAnswered, setJustAnswered] = useState(false);

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Speech recognition
  const recognitionRef = useRef<any>(null);

  // Silence detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  // Poll for live takeover
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load interview ──
  const loadInterview = useCallback(async () => {
    try {
      const res = await fetch(`/api/interview-session/${token}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Interview not found"); return; }
      setInterview(data.interview);
      const firstUnanswered = data.interview.questions.findIndex((q: any) => !q.answered && !q.skipped);
      setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);

      // Detect live takeover
      if (data.interview.isLive && !liveJoined) {
        setLiveJoined(true);
        if (data.interview.liveMessage) {
          stopListening();
          speakText(`Your interviewer has joined. ${data.interview.liveMessage}`, () => {});
        }
      }
    } catch {
      setError("Failed to load interview. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, liveJoined]);

  useEffect(() => { loadInterview(); }, []);

  // Poll every 3s for live takeover (only during ASYNC interview)
  useEffect(() => {
    if (!setupDone || !interview) return;
    if (interview.mode !== "ASYNC") return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/interview-session/${token}`);
        const data = await res.json();
        if (!res.ok) return;

        // Detect live takeover
        if (data.interview.isLive && !liveJoined) {
          setLiveJoined(true);
          stopListening();
          const msg = data.interview.liveMessage
            ? `Your interviewer has joined. ${data.interview.liveMessage}`
            : "Your interviewer has joined and will continue the interview.";
          speakText(msg, () => {});
        }

        // New live message from recruiter
        if (data.interview.liveMessage !== interview.liveMessage) {
          setInterview((prev: any) => ({ ...prev, liveMessage: data.interview.liveMessage }));
          if (data.interview.liveMessage) {
            stopListening();
            speakText(data.interview.liveMessage, () => {
              if (!data.interview.isLive) startListeningForAnswer();
            });
          }
        }
      } catch {}
    }, POLL_INTERVAL_MS);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [setupDone, interview, token, liveJoined]);

  // ── Recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn("Recording not available:", err);
    }
  };

  const stopAndUploadRecording = async (interviewId: string) => {
    if (!mediaRecorderRef.current) return;
    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        try {
          const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("recording", blob, "interview.webm");
          await fetch(`/api/recruiter/interviews/${interviewId}/recording`, {
            method: "POST",
            headers: { "x-share-token": token },
            body: formData,
          });
        } catch (err) {
          console.warn("Failed to upload recording:", err);
        } finally {
          audioStreamRef.current?.getTracks().forEach((t) => t.stop());
          resolve();
        }
      };
      mediaRecorderRef.current!.stop();
    });
  };

  // ── Speech synthesis helper ──
  const speakText = useCallback((text: string, onEnd: () => void) => {
    setIsAISpeaking(true);
    speak(text, gender, () => {
      setIsAISpeaking(false);
      onEnd();
    });
  }, [gender]);

  // ── Silence detection ──
  const startSilenceDetection = useCallback((stream: MediaStream, onSilence3s: () => void, onSilence8s: () => void) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      silenceStartRef.current = null;
      setSilencePhase("none");

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (avg < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) silenceStartRef.current = Date.now();
          const elapsed = Date.now() - silenceStartRef.current;

          if (elapsed >= SILENCE_REPEAT_MS + SILENCE_SKIP_MS) {
            // 8s total silence → skip
            setSilencePhase("skip");
            onSilence8s();
            return; // stop loop
          } else if (elapsed >= SILENCE_REPEAT_MS) {
            setSilencePhase("skip");
            onSilence3s(); // already fired, now counting skip
          } else if (elapsed >= 1000) {
            // approaching 3s
          }
        } else {
          // Sound detected — reset
          silenceStartRef.current = null;
          setSilencePhase("none");
        }

        silenceTimerRef.current = setTimeout(check, 200);
      };

      silenceTimerRef.current = setTimeout(check, 200);
    } catch (err) {
      console.warn("Silence detection not available:", err);
    }
  }, []);

  const stopSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    silenceStartRef.current = null;
    setSilencePhase("none");
  }, []);

  // ── Speech recognition ──
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopSilenceDetection();
    setIsListening(false);
  }, [stopSilenceDetection]);

  const startListeningForAnswer = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      setTranscript(finalTranscript.trim());
      // Reset silence on speech
      silenceStartRef.current = null;
      setSilencePhase("none");
    };

    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");

    // Start silence detection using mic stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      startSilenceDetection(
        stream,
        // 3s silence → repeat question
        () => {
          const q = interview?.questions[currentIndex];
          if (!q) return;
          setSilencePhase("warn");
          stopListening();
          speakText(
            `Let me repeat that. ${q.question}. I'll move to the next question in 5 seconds if I don't receive a response.`,
            () => {
              // Start 5s countdown then skip
              repeatTimerRef.current = setTimeout(() => {
                handleSkipQuestion();
              }, SILENCE_SKIP_MS);
              startListeningForAnswer();
            }
          );
        },
        // 8s total silence → skip
        () => {
          handleSkipQuestion();
        }
      );
      stream.getTracks().forEach((t) => t.stop()); // close this stream, recorder has the real one
    }).catch(() => {});
  }, [interview, currentIndex, speakText, stopListening, startSilenceDetection]);

  // ── Submit answer ──
  const submitAnswer = useCallback(async (questionId: string, answer: string, mode: "voice" | "text") => {
    try {
      const res = await fetch(`/api/recruiter/interviews/${interview.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer, shareToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInterview((prev: any) => ({
        ...prev,
        answeredQuestions: prev.answeredQuestions + 1,
        questions: prev.questions.map((q: any, i: number) =>
          i === currentIndex ? { ...q, answered: true } : q
        ),
      }));

      return true;
    } catch {
      return false;
    }
  }, [interview, token, currentIndex]);

  // ── Skip question ──
  const handleSkipQuestion = useCallback(async () => {
    stopListening();
    if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);

    const q = interview?.questions[currentIndex];
    if (!q) return;

    // Mark as skipped in DB via answer API with empty answer
    try {
      await fetch(`/api/recruiter/interviews/${interview.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: q.id,
          answer: "[No response — question skipped]",
          shareToken: token,
          skipped: true,
        }),
      });
    } catch {}

    setInterview((prev: any) => ({
      ...prev,
      questions: prev.questions.map((q: any, i: number) =>
        i === currentIndex ? { ...q, skipped: true } : q
      ),
    }));

    proceedToNext();
  }, [interview, currentIndex, token, stopListening]);

  // ── Proceed to next question or close ──
  const proceedToNext = useCallback(() => {
    if (!interview) return;

    const nextIndex = interview.questions.findIndex(
      (q: any, i: number) => i > currentIndex && !q.answered && !q.skipped
    );

    if (nextIndex === -1) {
      // All done
      endInterview();
    } else {
      setCurrentIndex(nextIndex);
      setTranscript("");

      if (interview.interviewType === "VOICE") {
        const nextQ = interview.questions[nextIndex];
        // Check for mid-interview instruction
        const instruction = interview.instructions?.find(
          (ins: any) =>
            (ins.trigger === "before_question" && ins.questionIndex === nextIndex) ||
            (ins.trigger === "question_type" && ins.questionType === nextQ.questionType)
        );

        const toSpeak = instruction
          ? `${instruction.message} ${nextQ.question}`
          : nextQ.question;

        setTimeout(() => {
          speakText(toSpeak, () => { startListeningForAnswer(); });
        }, 500);
      }
    }
  }, [interview, currentIndex, speakText, startListeningForAnswer]);

  // ── End interview ──
  const endInterview = useCallback(async () => {
    stopListening();
    setPhase("closing");

    const closingMsg = interview?.closing?.message
      || `That's all for today, ${interview?.candidateName?.split(" ")[0] || ""}. Thank you for your time. The team will review your responses and be in touch soon. Good luck!`;

    if (interview?.interviewType === "VOICE") {
      speakText(closingMsg, async () => {
        await stopAndUploadRecording(interview.id);
        setPhase("complete");
      });
    } else {
      await stopAndUploadRecording(interview?.id);
      setPhase("complete");
    }
  }, [interview, stopListening, speakText]);

  // ── Voice mode: confirm answer ──
  const handleVoiceConfirm = useCallback(async () => {
    if (!transcript.trim()) return;
    setConfirming(true);
    stopListening();

    const q = interview.questions[currentIndex];
    const ok = await submitAnswer(q.id, transcript, "voice");

    setConfirming(false);
    setTranscript("");

    if (ok) proceedToNext();
  }, [transcript, interview, currentIndex, submitAnswer, stopListening, proceedToNext]);

  // ── Voice mode: re-record ──
  const handleVoiceReRecord = useCallback(() => {
    setTranscript("");
    speakText(interview.questions[currentIndex].question, () => {
      startListeningForAnswer();
    });
  }, [interview, currentIndex, speakText, startListeningForAnswer]);

  // ── Text mode: submit ──
  const handleTextSubmit = useCallback(async () => {
    if (!textAnswer.trim()) return;
    setSubmitting(true);
    const q = interview.questions[currentIndex];
    const ok = await submitAnswer(q.id, textAnswer, "text");
    setSubmitting(false);
    if (ok) {
      setTextAnswer("");
      setJustAnswered(true);
    }
  }, [textAnswer, interview, currentIndex, submitAnswer]);

  const handleTextNext = useCallback(() => {
    setJustAnswered(false);
    const nextIndex = interview.questions.findIndex(
      (q: any, i: number) => i > currentIndex && !q.answered
    );
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    } else {
      endInterview();
    }
  }, [interview, currentIndex, endInterview]);

  // ── Start interview after setup ──
  const handleSetupComplete = useCallback(async (
    selectedGender: "male" | "female" | "prefer-not-to-say",
    dob: string
  ) => {
    setGender(selectedGender);
    setSetupDone(true);

    // Start recording
    if (interview?.interviewType === "VOICE") {
      await startRecording();
    }

    setPhase("opening");

    const openingMsg = interview?.opening?.message
      || `Hi ${interview?.candidateName?.split(" ")[0] || ""}! Welcome to your interview${interview?.jobTitle ? ` for the ${interview.jobTitle} position` : ""}. I'm your AI interviewer today. Take your time, speak clearly, and answer as fully as you can. Let's begin.`;

    if (interview?.interviewType === "VOICE") {
      // Wait for voices to load
      const startSpeaking = () => {
        speakText(openingMsg, () => {
          setPhase("interview");
          const firstQ = interview.questions[0];
          if (firstQ) {
            setTimeout(() => {
              speakText(firstQ.question, () => {
                startListeningForAnswer();
              });
            }, 800);
          }
        });
      };

      // Chrome needs voices to load
      if (window.speechSynthesis.getVoices().length > 0) {
        startSpeaking();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          startSpeaking();
        };
      }
    } else {
      setPhase("interview");
    }
  }, [interview, speakText, startListeningForAnswer]);

  // ── Error / loading states ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-white font-bold text-xl mb-2">Interview Error</p>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  // ── Setup screen ──
  if (!setupDone) {
    return (
      <SetupScreen
        candidateName={interview.candidateName}
        jobTitle={interview.jobTitle}
        companyName={interview.companyName}
        interviewType={interview.interviewType}
        onStart={handleSetupComplete}
      />
    );
  }

  // ── Voice interview ──
  if (interview.interviewType === "VOICE") {
    return (
      <VoiceCallScreen
        interview={interview}
        currentIndex={currentIndex}
        isAISpeaking={isAISpeaking}
        isListening={isListening}
        transcript={transcript}
        silencePhase={silencePhase}
        onConfirm={handleVoiceConfirm}
        onReRecord={handleVoiceReRecord}
        onSkip={handleSkipQuestion}
        confirming={confirming}
        phase={phase}
        liveJoined={liveJoined}
      />
    );
  }

  // ── Text interview ──
  return (
    <TextInterviewScreen
      interview={interview}
      currentIndex={currentIndex}
      answer={textAnswer}
      setAnswer={setTextAnswer}
      onSubmit={handleTextSubmit}
      submitting={submitting}
      onNext={handleTextNext}
      justAnswered={justAnswered}
      setCurrentIndex={setCurrentIndex}
      setJustAnswered={setJustAnswered}
      phase={phase}
    />
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    }>
      <InterviewSession />
    </Suspense>
  );
}
