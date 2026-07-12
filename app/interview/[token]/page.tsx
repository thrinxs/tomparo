"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams } from "next/navigation";
import {
  Mic, Loader2, CheckCircle, AlertTriangle,
  Volume2, VolumeX, SkipForward, RotateCcw, Send,
  User, Calendar, ChevronRight, MessageSquare, Play, Square,
  CornerDownRight,
} from "lucide-react";
import { ELEVENLABS_VOICES, DEFAULT_MALE_VOICE_ID, DEFAULT_FEMALE_VOICE_ID } from "@/lib/ai/interview-engine";

function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function paceFromSlider(v: number) {
  const t = v / 100;
  return {
    silenceRepeat: lerp(8000, 1200, t),
    silenceSkip: lerp(14000, 2000, t),
    speechRate: parseFloat((0.72 + (1.15 - 0.72) * t).toFixed(2)),
  };
}
function paceLabel(v: number) {
  if (v <= 15) return "Very Patient 🐢";
  if (v <= 35) return "Relaxed";
  if (v <= 60) return "Normal 🚶";
  if (v <= 80) return "Brisk";
  return "Fast 🏃";
}

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
  "herbert","frederick","ray","joel","edwin","don","troy","barry","alexander",
  "bernard","mario","leo","angel","leroy","andres","brett",
  "emeka","chidi","tunde","femi","seun","kunle","niyi","taiwo","kehinde","babatunde",
  "adewale","adebayo","oluwaseun","olumide","olusegun","chukwuemeka","ifeanyi",
  "obinna","chibuike","ugochukwu","kelechi","nnamdi","chinedu","ike","ikenna",
  "amara","eze","uche","uzoma","chukwuma","obi","chibundo","chisom",
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
  "ngozi","chioma","amaka","adaeze","adaora","nneka","chinwe","ifeoma","obiageli",
  "nkiruka","chinyere","ugochi","adanna","uju","ogechi","chizoba","amarachi",
  "tolani","folake","bimpe","sade","yetunde","gbemi","ronke","bisi","funke",
  "tope","kemi","wura","shade","bunmi","toyin","abike","yinka","lola",
]);
function detectGender(name: string): "male" | "female" | null {
  const first = name.trim().split(" ")[0].toLowerCase();
  if (MALE_NAMES.has(first)) return "male";
  if (FEMALE_NAMES.has(first)) return "female";
  return null;
}

const SILENCE_THRESHOLD = 8;
const POLL_INTERVAL_MS = 3000;

async function speakElevenLabs(text: string, voiceId: string, onEnd: () => void): Promise<() => void> {
  let cancelled = false;
  let audioEl: HTMLAudioElement | null = null;

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.trim(), voiceId }),
  });

  // 503 = both ElevenLabs and HuggingFace failed — reject so doSpeak falls back to Web Speech
  if (!res.ok) throw new Error("TTS unavailable");

  const blob = await res.blob();
  if (cancelled) return () => {};

  const url = URL.createObjectURL(blob);
  audioEl = new Audio(url);
  audioEl.onended = () => { URL.revokeObjectURL(url); if (!cancelled) onEnd(); };
  audioEl.onerror = () => { URL.revokeObjectURL(url); if (!cancelled) onEnd(); };
  audioEl.play();

  return () => { cancelled = true; if (audioEl) { audioEl.pause(); audioEl.src = ""; } };
}

function getWebVoice(gender: "male" | "female" | "prefer-not-to-say"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const priority = gender === "male"
    ? ["Google UK English Male", "Microsoft David", "Daniel", "Alex"]
    : gender === "female"
    ? ["Google UK English Female", "Microsoft Zira", "Samantha", "Karen"]
    : [];
  for (const name of priority) {
    const found = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found;
  }
  return voices[0] || null;
}

function speakWebSpeech(text: string, gender: "male" | "female" | "prefer-not-to-say", rate: number, onEnd: () => void): () => void {
  let ended = false;
  let watchdog: NodeJS.Timeout;
  const finish = () => { if (ended) return; ended = true; clearTimeout(watchdog); onEnd(); };
  window.speechSynthesis.cancel();
  const tid = setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = gender === "male" ? 0.85 : gender === "female" ? 1.1 : 1.0;
    utter.volume = 1;
    const voice = getWebVoice(gender);
    if (voice) utter.voice = voice;
    utter.onend = finish;
    utter.onerror = finish;
    const estimatedMs = Math.max(3000, (text.length / 15) * (1 / rate) * 1000 + 3000);
    watchdog = setTimeout(() => { finish(); }, estimatedMs);
    const resumeInterval = setInterval(() => {
      if (ended) { clearInterval(resumeInterval); return; }
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 5000);
    window.speechSynthesis.speak(utter);
  }, 80);
  return () => { ended = true; clearTimeout(tid); clearTimeout(watchdog); window.speechSynthesis.cancel(); };
}

// ── Setup Screen ───────────────────────────────────────────────────────────────
function SetupScreen({ candidateName, jobTitle, companyName, interviewType, voiceTier, defaultVoiceId, onStart }: {
  candidateName: string; jobTitle: string | null; companyName: string | null;
  interviewType: string; voiceTier: string; defaultVoiceId: string | null;
  onStart: (gender: "male" | "female" | "prefer-not-to-say", dob: string, paceValue: number, voiceId: string | null) => void;
}) {
  const detected = detectGender(candidateName);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">(detected || "prefer-not-to-say");
  const [dob, setDob] = useState("");
  const [dobError, setDobError] = useState("");
  const [paceValue, setPaceValue] = useState(45);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(defaultVoiceId);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const cancelPreviewRef = useRef<(() => void) | null>(null);
  const pace = paceFromSlider(paceValue);
  const isElevenLabs = voiceTier === "elevenlabs";

  useEffect(() => {
    if (!isElevenLabs || !defaultVoiceId) return;
    if (selectedVoiceId === defaultVoiceId) {
      setSelectedVoiceId(gender === "female" ? DEFAULT_FEMALE_VOICE_ID : DEFAULT_MALE_VOICE_ID);
    }
  }, [gender]);

  const handlePreview = async () => {
    if (isPreviewing) { cancelPreviewRef.current?.(); cancelPreviewRef.current = null; setIsPreviewing(false); return; }
    setIsPreviewing(true);
    const text = `Hello! I'm your AI interviewer. This is how I will sound during your interview.`;
    if (isElevenLabs && selectedVoiceId) {
      cancelPreviewRef.current = await speakElevenLabs(text, selectedVoiceId, () => { setIsPreviewing(false); });
    } else {
      cancelPreviewRef.current = speakWebSpeech(text, gender, pace.speechRate, () => { setIsPreviewing(false); });
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    cancelPreviewRef.current?.();
    if (isElevenLabs) await speakElevenLabs("Hello! I'm your AI interviewer for today.", voiceId, () => {});
  };

  useEffect(() => () => { cancelPreviewRef.current?.(); }, []);

  const handleStart = () => {
    if (!dob) { setDobError("Please enter your date of birth"); return; }
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365));
    if (age < 16 || age > 100) { setDobError("Please enter a valid date of birth"); return; }
    cancelPreviewRef.current?.();
    onStart(gender, dob, paceValue, selectedVoiceId);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Hi, {candidateName.split(" ")[0]}!</h1>
          <p className="text-slate-400 text-sm">
            {companyName} has invited you to a {interviewType === "VOICE" ? "Voice Call" : "Text"} interview
            {jobTitle ? ` for the ${jobTitle} position` : ""}.
          </p>
        </div>

        <div className={`rounded-2xl border p-4 text-center ${interviewType === "VOICE" ? "border-violet-500/20 bg-violet-500/5" : "border-indigo-500/20 bg-indigo-500/5"}`}>
          {interviewType === "VOICE" ? (
            <>
              <Mic className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">Voice Interview</p>
              <p className="text-xs text-slate-400">AI will read each question aloud. Speak your answers clearly.</p>
              {isElevenLabs && <p className="text-xs text-violet-400 mt-1">✨ Human-like AI voice enabled</p>}
            </>
          ) : (
            <>
              <MessageSquare className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">Text Interview</p>
              <p className="text-xs text-slate-400">Read each question and type your answer. No timer.</p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-white">Your Gender</p>
            {detected && <span className="text-[10px] text-slate-500 ml-auto">detected — change if incorrect</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["male", "female", "prefer-not-to-say"] as const).map((g) => (
              <button key={g} onClick={() => setGender(g)} className={`py-2.5 rounded-xl text-xs font-medium transition border ${gender === g ? "bg-purple-600 border-purple-600 text-white" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"}`}>
                {g === "prefer-not-to-say" ? "Prefer not to say" : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-white">Date of Birth</p>
          </div>
          <input type="date" value={dob}
            onChange={(e) => { setDob(e.target.value); setDobError(""); }}
            max={new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition"
          />
          {dobError && <p className="text-xs text-red-400">{dobError}</p>}
        </div>

        {interviewType === "VOICE" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Interview Pace</p>
              <span className="text-xs font-semibold text-purple-400">{paceLabel(paceValue)}</span>
            </div>
            <div className="space-y-3">
              <input type="range" min={0} max={100} step={1} value={paceValue}
                onChange={(e) => setPaceValue(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#9333ea" }}
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-600">🐢 Very Slow</span>
                <span className="text-[10px] text-slate-600">🏃 Very Fast</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">Repeat after</p>
                  <p className="text-sm font-bold text-white">{(pace.silenceRepeat / 1000).toFixed(1)}s</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">Skip after</p>
                  <p className="text-sm font-bold text-white">{((pace.silenceRepeat + pace.silenceSkip) / 1000).toFixed(0)}s</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">AI speed</p>
                  <p className="text-sm font-bold text-white">{pace.speechRate}×</p>
                </div>
              </div>
              <button onClick={handlePreview} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition border ${isPreviewing ? "bg-purple-600 border-purple-600 text-white" : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"}`}>
                {isPreviewing ? <><Square className="w-3 h-3" />Stop preview</> : <><Play className="w-3 h-3" />Preview pace + voice</>}
              </button>
            </div>
          </div>
        )}

        {interviewType === "VOICE" && isElevenLabs && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">AI Voice</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Your recruiter set a default. You can change it.</p>
              </div>
              <span className="text-[10px] text-slate-500">▶ to preview</span>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {ELEVENLABS_VOICES.map((v) => (
                <div key={v.id} onClick={() => setSelectedVoiceId(v.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition border cursor-pointer ${selectedVoiceId === v.id ? "bg-purple-600 border-purple-600 text-white" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{v.name}</p>
                    <p className={`text-[10px] truncate ${selectedVoiceId === v.id ? "text-purple-200" : "text-slate-600"}`}>{v.desc}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handlePreviewVoice(v.id); }}
                    className={`ml-3 p-1.5 rounded-lg shrink-0 transition ${selectedVoiceId === v.id ? "hover:bg-white/20 text-white" : "hover:bg-white/10 text-slate-500 hover:text-white"}`}>
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {interviewType === "VOICE" && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tips</p>
            {[
              "Find a quiet place with no background noise",
              "Speak clearly into your microphone",
              `Silent for ${(pace.silenceRepeat / 1000).toFixed(0)}s → AI repeats the question`,
              `Silent for ${((pace.silenceRepeat + pace.silenceSkip) / 1000).toFixed(0)}s total → question skipped`,
              "AI may ask a follow-up if your answer is interesting — answer naturally",
            ].map((tip) => (
              <p key={tip} className="text-xs text-slate-500 flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 shrink-0">•</span>{tip}
              </p>
            ))}
          </div>
        )}

        <button onClick={handleStart} className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2">
          Begin Interview <ChevronRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[11px] text-slate-600">
          By starting, you consent to this interview being recorded for evaluation purposes.
        </p>
      </div>
    </div>
  );
}

// ── Voice Call Screen ──────────────────────────────────────────────────────────
function VoiceCallScreen({ interview, currentIndex, isAISpeaking, isListening, transcript, silencePhase, onConfirm, onReRecord, onSkip, confirming, phase, liveJoined, isFollowUp, followUpQuestion }: {
  interview: any; currentIndex: number; isAISpeaking: boolean; isListening: boolean;
  transcript: string; silencePhase: "none" | "warn" | "skip"; onConfirm: () => void;
  onReRecord: () => void; onSkip: () => void; confirming: boolean; phase: string;
  liveJoined: boolean; isFollowUp: boolean; followUpQuestion: string | null;
}) {
  const question = isFollowUp && followUpQuestion
    ? { question: followUpQuestion, order: currentIndex + 1 }
    : interview.questions[currentIndex];
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
            <span className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-ping" />
            <span className="absolute inset-[-8px] rounded-full border border-purple-500/20 animate-ping" style={{ animationDelay: "0.4s" }} />
          </div>
          <p className="text-slate-400 text-sm">{phase === "opening" ? "Your interview is starting..." : "Wrapping up..."}</p>
          <div className="flex items-center justify-center gap-1.5">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="w-1 bg-purple-400 rounded-full animate-bounce" style={{ height: "14px", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
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
            <p className="text-slate-400 text-sm">Thank you, {interview.candidateName.split(" ")[0]}. Your responses have been recorded. The team will be in touch soon.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm text-emerald-400 font-medium">{answeredCount} of {interview.totalQuestions} questions answered</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">AI Voice Interview</p>
            <p className="text-white font-semibold text-sm">{interview.jobTitle || "Interview"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{answeredCount} / {interview.totalQuestions}</p>
            <p className="text-white font-semibold text-sm">{progress}%</p>
          </div>
        </div>
        <div className="h-0.5 bg-white/5">
          <div className="h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full space-y-8">
        {liveJoined && (
          <div className="w-full rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
            <p className="text-sm font-semibold text-blue-400">👤 Your interviewer has joined</p>
          </div>
        )}
        <div className="relative">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isAISpeaking ? "bg-purple-500/30" : isListening ? "bg-indigo-500/20" : "bg-white/5"}`}>
            {isAISpeaking ? <Volume2 className="w-12 h-12 text-purple-400" /> : isListening ? <Mic className="w-12 h-12 text-indigo-400" /> : <VolumeX className="w-12 h-12 text-slate-600" />}
          </div>
          {(isAISpeaking || isListening) && (
            <>
              <span className={`absolute inset-0 rounded-full border-2 animate-ping ${isAISpeaking ? "border-purple-500/40" : "border-indigo-500/40"}`} />
              <span className={`absolute inset-[-12px] rounded-full border animate-ping ${isAISpeaking ? "border-purple-500/20" : "border-indigo-500/20"}`} style={{ animationDelay: "0.3s" }} />
            </>
          )}
        </div>
        <div className="text-center space-y-1">
          {isAISpeaking && (
            <>
              <p className="text-purple-400 font-semibold text-sm">AI is speaking...</p>
              <div className="flex items-center justify-center gap-1">
                {[0,1,2,3,4].map((i) => <div key={i} className="w-1 bg-purple-400 rounded-full animate-bounce" style={{ height: "12px", animationDelay: `${i * 0.1}s` }} />)}
              </div>
            </>
          )}
          {isListening && !isAISpeaking && (
            <>
              <p className="text-indigo-400 font-semibold text-sm">Listening...</p>
              {silencePhase === "warn" && <p className="text-amber-400 text-xs animate-pulse">Repeating question...</p>}
              {silencePhase === "skip" && <p className="text-red-400 text-xs animate-pulse">No response — skipping soon...</p>}
            </>
          )}
          {!isAISpeaking && !isListening && !transcript && <p className="text-slate-500 text-sm">Preparing...</p>}
        </div>
        {question && (
          <div className={`w-full rounded-2xl border p-6 ${isFollowUp ? "border-indigo-500/30 bg-indigo-500/5" : "border-white/10 bg-white/[0.02]"}`}>
            {isFollowUp && (
              <div className="flex items-center gap-1.5 mb-3">
                <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Follow-up</p>
              </div>
            )}
            {!isFollowUp && <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Question {currentIndex + 1} of {interview.totalQuestions}</p>}
            <p className="text-white text-base font-medium leading-relaxed">{question.question}</p>
          </div>
        )}
        {transcript && !isAISpeaking && (
          <div className="w-full space-y-3">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
              <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-2">Your Answer</p>
              <p className="text-white text-sm leading-relaxed">{transcript}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onReRecord} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-medium hover:text-white hover:bg-white/10 transition">
                <RotateCcw className="w-4 h-4" /> Re-record
              </button>
              <button onClick={onConfirm} disabled={confirming} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50">
                {confirming ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4" />Confirm</>}
              </button>
            </div>
          </div>
        )}
        {isListening && !transcript && !isFollowUp && (
          <button onClick={onSkip} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-medium hover:text-white transition">
            <SkipForward className="w-3.5 h-3.5" /> Skip this question
          </button>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          {interview.questions.filter((q: any) => !q.isFollowUp).map((q: any, i: number) => (
            <div key={q.id} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${q.answered ? "bg-emerald-500/20 text-emerald-400" : q.skipped ? "bg-slate-500/20 text-slate-500" : i === currentIndex ? "bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/40" : "bg-white/5 text-slate-600"}`}>
              {q.answered ? "✓" : q.skipped ? "—" : i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Text Interview Screen ──────────────────────────────────────────────────────
function TextInterviewScreen({ interview, currentIndex, answer, setAnswer, onSubmit, submitting, onNext, justAnswered, setCurrentIndex, setJustAnswered, phase, pendingFollowUp, onAnswerFollowUp, followUpAnswer, setFollowUpAnswer, submittingFollowUp, followUpJustAnswered, onNextAfterFollowUp }: {
  interview: any; currentIndex: number; answer: string; setAnswer: (v: string) => void;
  onSubmit: () => void; submitting: boolean; onNext: () => void; justAnswered: boolean;
  setCurrentIndex: (i: number) => void; setJustAnswered: (v: boolean) => void; phase: string;
  pendingFollowUp: any | null; onAnswerFollowUp: () => void; followUpAnswer: string;
  setFollowUpAnswer: (v: string) => void; submittingFollowUp: boolean;
  followUpJustAnswered: boolean; onNextAfterFollowUp: () => void;
}) {
  const answeredCount = interview.questions.filter((q: any) => q.answered).length;
  const progress = Math.round((answeredCount / interview.totalQuestions) * 100);
  const currentQuestion = interview.questions[currentIndex];
  const allAnswered = interview.questions.every((q: any) => q.answered);
  const labels: Record<string, string> = {
    CV_VERIFICATION: "About Your Experience", LOCATION_BASED: "About Your Location",
    JOB_SPECIFIC: "About The Role", BEHAVIOURAL: "Behavioural",
  };

  if (phase === "complete" || allAnswered) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Interview Complete! 🎉</h2>
            <p className="text-slate-400 text-sm">Thank you, {interview.candidateName.split(" ")[0]}. The team will review your responses and be in touch soon.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm text-emerald-400 font-medium">{answeredCount} of {interview.totalQuestions} questions answered</p>
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
          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Hi, {interview.candidateName.split(" ")[0]}!</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Answer each question thoughtfully. Take your time — there's no timer.</p>
        </div>

        {currentQuestion && !currentQuestion.answered && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{labels[currentQuestion.questionType] || currentQuestion.questionType}</span>
                <span className="text-xs text-slate-600">Question {currentIndex + 1} of {interview.questions.filter((q:any) => !q.isFollowUp).length}</span>
              </div>
              <p className="text-white text-lg font-medium leading-relaxed">{currentQuestion.question}</p>
              {!justAnswered && !pendingFollowUp && !followUpJustAnswered && (
                <div className="space-y-4">
                  <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..." rows={6}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition text-sm"
                  />
                  <button onClick={onSubmit} disabled={submitting || !answer.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition disabled:opacity-50">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Checking...</> : <><Send className="w-4 h-4" />Submit Answer</>}
                  </button>
                </div>
              )}
              {justAnswered && !pendingFollowUp && !followUpJustAnswered && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                  <p className="text-sm text-purple-300">Processing your answer...</p>
                </div>
              )}
            </div>

            {pendingFollowUp && !followUpJustAnswered && (
              <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-8 space-y-6 ml-4 relative">
                <div className="absolute -left-4 top-8 w-4 h-0.5 bg-indigo-500/30" />
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Follow-up</span>
                </div>
                <p className="text-white text-base font-medium leading-relaxed">{pendingFollowUp.question}</p>
                <div className="space-y-4">
                  <textarea value={followUpAnswer} onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="Type your answer here..." rows={5}
                    className="w-full rounded-xl border border-indigo-500/20 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 resize-none transition text-sm"
                  />
                  <button onClick={onAnswerFollowUp} disabled={submittingFollowUp || !followUpAnswer.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition disabled:opacity-50">
                    {submittingFollowUp ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4" />Submit Answer</>}
                  </button>
                </div>
              </div>
            )}

            {followUpJustAnswered && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-semibold">Great answer!</p>
                  <p className="text-slate-400 text-sm mt-1">Moving to the next question.</p>
                </div>
                <button onClick={onNextAfterFollowUp} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition">
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {justAnswered && !pendingFollowUp && followUpJustAnswered === false && answer === "" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-semibold">Answer received!</p>
                </div>
                <button onClick={onNext} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition">
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">All Questions</p>
          <div className="space-y-2">
            {interview.questions.filter((q: any) => !q.isFollowUp).map((q: any, i: number) => (
              <div key={q.id} onClick={() => { if (!q.answered) { setCurrentIndex(i); setJustAnswered(false); } }}
                className={`flex items-center gap-3 p-3 rounded-xl transition cursor-pointer ${i === currentIndex && !q.answered ? "bg-purple-500/10 border border-purple-500/20" : q.answered ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-white/[0.02] border border-white/5 hover:bg-white/5"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${q.answered ? "bg-emerald-500/20 text-emerald-400" : i === currentIndex ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-slate-500"}`}>
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
  const [setupDone, setSetupDone] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">("prefer-not-to-say");
  const [phase, setPhase] = useState<"opening" | "interview" | "closing" | "complete">("opening");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [silencePhase, setSilencePhase] = useState<"none" | "warn" | "skip">("none");
  const [confirming, setConfirming] = useState(false);
  const [liveJoined, setLiveJoined] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [followUpQuestionId, setFollowUpQuestionId] = useState<string | null>(null);
  const [checkingFollowUp, setCheckingFollowUp] = useState(false);
  const [pendingFollowUp, setPendingFollowUp] = useState<any | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpJustAnswered, setFollowUpJustAnswered] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justAnswered, setJustAnswered] = useState(false);

  // ── Refs ──
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const assemblyWsRef = useRef<WebSocket | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const aaiAudioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const isRepeatingRef = useRef(false);
  const cancelSpeakRef = useRef<(() => void) | null>(null);
  const isListeningRef = useRef(false);
  const lastLiveMessageRef = useRef<string | null>(null);
  const genderRef = useRef(gender);
  const speechRateRef = useRef(0.92);
  const voiceIdRef = useRef<string | null>(null);
  const voiceTierRef = useRef<string>("web-speech");
  const silenceRepeatMsRef = useRef(3000);
  const silenceSkipMsRef = useRef(5000);
  const interviewRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  const isFollowUpRef = useRef(false);
  const followUpQuestionRef = useRef<string | null>(null);
  const followUpQuestionIdRef = useRef<string | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => { genderRef.current = gender; }, [gender]);
  useEffect(() => { interviewRef.current = interview; }, [interview]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isFollowUpRef.current = isFollowUp; }, [isFollowUp]);
  useEffect(() => { followUpQuestionRef.current = followUpQuestion; }, [followUpQuestion]);
  useEffect(() => { followUpQuestionIdRef.current = followUpQuestionId; }, [followUpQuestionId]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  // ── Load interview ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/interview-session/${token}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Interview not found"); return; }
        setInterview(data.interview);
        interviewRef.current = data.interview;
        voiceIdRef.current = data.interview.voiceId || null;
        voiceTierRef.current = data.interview.voiceTier || "web-speech";
        const mainQuestions = data.interview.questions.filter((q: any) => !q.isFollowUp);
        const first = mainQuestions.findIndex((q: any) => !q.answered && !q.skipped);
        const idx = first === -1 ? 0 : first;
        setCurrentIndex(idx);
        currentIndexRef.current = idx;
      } catch { setError("Failed to load interview. Please try again."); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  // ── doSpeak — finish guard prevents double-fire ──
  const doSpeak = useCallback((text: string, onEnd: () => void) => {
    cancelSpeakRef.current?.();
    setIsAISpeaking(true);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setIsAISpeaking(false);
      onEnd();
    };
    if (voiceTierRef.current === "elevenlabs" && voiceIdRef.current) {
      speakElevenLabs(text, voiceIdRef.current, finish)
        .then((cancel) => { cancelSpeakRef.current = cancel; })
        .catch(() => { if (!finished) cancelSpeakRef.current = speakWebSpeech(text, genderRef.current, speechRateRef.current, finish); });
    } else {
      cancelSpeakRef.current = speakWebSpeech(text, genderRef.current, speechRateRef.current, finish);
    }
  }, []);

  // ── Stop silence detection ──
  const stopSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (repeatTimerRef.current) { clearTimeout(repeatTimerRef.current); repeatTimerRef.current = null; }
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    silenceStartRef.current = null;
    isRepeatingRef.current = false;
    setSilencePhase("none");
  }, []);

  // ── Stop AssemblyAI WebSocket ──
  const stopAssemblyAI = useCallback(() => {
    if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
    if (aaiAudioContextRef.current) { aaiAudioContextRef.current.close().catch(() => {}); aaiAudioContextRef.current = null; }
    if (assemblyWsRef.current) {
      assemblyWsRef.current.onclose = null;
      assemblyWsRef.current.close();
      assemblyWsRef.current = null;
    }
  }, []);

  // ── Stop listening ──
  const stopListening = useCallback(() => {
    stopAssemblyAI();
    stopSilenceDetection();
    setIsListening(false);
    isListeningRef.current = false;
  }, [stopAssemblyAI, stopSilenceDetection]);

  // ── Submit answer ──
  const submitAnswer = useCallback(async (questionId: string, answer: string) => {
    const iv = interviewRef.current;
    try {
      const res = await fetch(`/api/recruiter/interviews/${iv.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer, shareToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInterview((prev: any) => ({
        ...prev,
        answeredQuestions: prev.answeredQuestions + 1,
        questions: prev.questions.map((q: any) => q.id === questionId ? { ...q, answered: true } : q),
      }));
      return true;
    } catch { return false; }
  }, [token]);

  // ── Check follow-up ──
  const checkFollowUp = useCallback(async (questionId: string, answer: string): Promise<boolean> => {
    const iv = interviewRef.current;
    if (!iv?.allowFollowUps) return false;
    setCheckingFollowUp(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${iv.id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer, shareToken: token }),
      });
      const data = await res.json();
      if (data.shouldAsk && data.followUpQuestion) {
        setFollowUpQuestion(data.followUpQuestion.question);
        setFollowUpQuestionId(data.followUpQuestion.id);
        followUpQuestionRef.current = data.followUpQuestion.question;
        followUpQuestionIdRef.current = data.followUpQuestion.id;
        setInterview((prev: any) => ({
          ...prev,
          totalQuestions: prev.totalQuestions + 1,
          questions: [...prev.questions, { ...data.followUpQuestion, answered: false, skipped: false }],
        }));
        return true;
      }
      return false;
    } catch { return false; }
    finally { setCheckingFollowUp(false); }
  }, [token]);

  // ── End interview ──
  const endInterview = useCallback(async () => {
    stopListening();
    setPhase("closing");
    const iv = interviewRef.current;
    const closingMsg = iv?.closing?.message
      || `That's all for today, ${iv?.candidateName?.split(" ")[0] || ""}. Thank you for your time. The team will review your responses and be in touch soon. Good luck!`;
    if (iv?.interviewType === "VOICE") {
      doSpeak(closingMsg, async () => { await stopAndUploadRecording(iv.id); setPhase("complete"); });
    } else {
      await stopAndUploadRecording(iv?.id);
      setPhase("complete");
    }
  }, [stopListening, doSpeak]);

  // ── Skip question — declared BEFORE startSilenceDetection ──
  const handleSkipQuestion = useCallback(async () => {
    stopListening();
    if (repeatTimerRef.current) { clearTimeout(repeatTimerRef.current); repeatTimerRef.current = null; }
    const iv = interviewRef.current;
    const idx = currentIndexRef.current;
    const mainQuestions = iv?.questions?.filter((q: any) => !q.isFollowUp) || [];
    const q = mainQuestions[idx];
    if (!q) return;
    try {
      await fetch(`/api/recruiter/interviews/${iv.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, answer: "[No response — question skipped]", shareToken: token, skipped: true }),
      });
    } catch {}
    setInterview((prev: any) => ({
      ...prev,
      questions: prev.questions.map((q: any, i: number) => i === idx ? { ...q, skipped: true } : q),
    }));
    proceedToNext();
  }, [stopListening, token]);

  // ── Silence detection — declared AFTER handleSkipQuestion ──
  const startSilenceDetection = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      silenceStartRef.current = null;
      isRepeatingRef.current = false;
      setSilencePhase("none");
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        if (isRepeatingRef.current || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) silenceStartRef.current = Date.now();
          const elapsed = Date.now() - silenceStartRef.current;
          const repeatMs = silenceRepeatMsRef.current;
          const skipMs = silenceSkipMsRef.current;
          if (elapsed >= repeatMs + skipMs) {
            if (!isRepeatingRef.current) { isRepeatingRef.current = true; handleSkipQuestion(); }
            return;
          } else if (elapsed >= repeatMs && !isRepeatingRef.current) {
            isRepeatingRef.current = true;
            silenceStartRef.current = null;
            setSilencePhase("warn");
            stopListening();
            const currentQ = isFollowUpRef.current && followUpQuestionRef.current
              ? followUpQuestionRef.current
              : interviewRef.current?.questions?.filter((q: any) => !q.isFollowUp)[currentIndexRef.current]?.question;
            if (!currentQ) return;
            doSpeak(
              `Let me repeat that. ${currentQ}. I'll move on if I don't receive a response.`,
              () => {
                repeatTimerRef.current = setTimeout(() => { handleSkipQuestion(); }, skipMs);
                startListeningForAnswer();
              }
            );
            return;
          }
        } else {
          silenceStartRef.current = null;
          setSilencePhase("none");
        }
        silenceTimerRef.current = setTimeout(check, 200);
      };
      silenceTimerRef.current = setTimeout(check, 200);
    } catch (err) { console.warn("Silence detection not available:", err); }
  }, [doSpeak, stopListening, handleSkipQuestion]);

  // ── AssemblyAI — start listening ──
  const startListeningForAnswer = useCallback(async () => {
    stopAssemblyAI();
    stopSilenceDetection();
    finalTranscriptRef.current = "";
    setTranscript("");

    try {
      if (!audioStreamRef.current?.active) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });
        audioStreamRef.current = stream;
      }
    } catch (err) { console.warn("Microphone access denied:", err); return; }

    let aaiToken: string;
    try {
      const res = await fetch("/api/assemblyai/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken: token }),
      });
      const data = await res.json();
      if (!data.token) throw new Error("No token returned");
      aaiToken = data.token;
    } catch (err) { console.error("Failed to get AssemblyAI token:", err); return; }

    const ws = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${aaiToken}`);
    assemblyWsRef.current = ws;

    ws.onopen = () => {
      setIsListening(true);
      isListeningRef.current = true;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const aaiCtx = new AudioCtx({ sampleRate: 16000 });
        aaiAudioContextRef.current = aaiCtx;
        const source = aaiCtx.createMediaStreamSource(audioStreamRef.current!);
        const processor = aaiCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const float32 = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, Math.floor(float32[i] * 32768)));
          }
          ws.send(int16.buffer);
        };
        source.connect(processor);
        processor.connect(aaiCtx.destination);
        startSilenceDetection(audioStreamRef.current!);
      } catch (err) { console.warn("Audio capture setup failed:", err); }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.message_type === "FinalTranscript" && msg.text?.trim()) {
          finalTranscriptRef.current += msg.text + " ";
          const full = finalTranscriptRef.current.trim();
          if (repeatTimerRef.current) { clearTimeout(repeatTimerRef.current); repeatTimerRef.current = null; }
          isRepeatingRef.current = false;
          setSilencePhase("none");
          silenceStartRef.current = null;
          setTranscript(full);
        } else if (msg.message_type === "PartialTranscript" && msg.text?.trim()) {
          setTranscript((finalTranscriptRef.current + msg.text).trim());
          silenceStartRef.current = null;
          setSilencePhase("none");
        }
      } catch {}
    };

    ws.onerror = (e) => { console.error("AssemblyAI WebSocket error:", e); setIsListening(false); isListeningRef.current = false; };
    ws.onclose = () => { if (isListeningRef.current) { setIsListening(false); isListeningRef.current = false; } };
  }, [token, stopAssemblyAI, stopSilenceDetection, startSilenceDetection]);

  // ── Proceed to next question ──
  const proceedToNext = useCallback(() => {
    const iv = interviewRef.current;
    const idx = currentIndexRef.current;
    if (!iv) return;
    setIsFollowUp(false); setFollowUpQuestion(null); setFollowUpQuestionId(null);
    isFollowUpRef.current = false; followUpQuestionRef.current = null; followUpQuestionIdRef.current = null;
    const mainQuestions = iv.questions.filter((q: any) => !q.isFollowUp);
    const nextIndex = mainQuestions.findIndex((q: any, i: number) => i > idx && !q.answered && !q.skipped);
    if (nextIndex === -1) {
      endInterview();
    } else {
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setTranscript("");
      finalTranscriptRef.current = "";
      if (iv.interviewType === "VOICE") {
        const nextQ = mainQuestions[nextIndex];
        const instruction = iv.instructions?.find((ins: any) =>
          (ins.trigger === "before_question" && ins.questionIndex === nextIndex) ||
          (ins.trigger === "question_type" && ins.questionType === nextQ.questionType)
        );
        const toSpeak = instruction ? `${instruction.message} ${nextQ.question}` : nextQ.question;
        setTimeout(() => { doSpeak(toSpeak, () => { startListeningForAnswer(); }); }, 600);
      }
    }
  }, [doSpeak, startListeningForAnswer, endInterview]);

  // ── Poll for live takeover ──
  useEffect(() => {
    if (!setupDone || !interview || interview.mode !== "ASYNC") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/interview-session/${token}`);
        const data = await res.json();
        if (!res.ok) return;
        if (data.interview.isLive && !liveJoined) {
          setLiveJoined(true); stopListening();
          const msg = data.interview.liveMessage || "Your interviewer has joined and will continue the interview.";
          lastLiveMessageRef.current = msg;
          doSpeak(msg, () => {});
          return;
        }
        if (data.interview.isLive && data.interview.liveMessage) {
          const newMsg = data.interview.liveMessage;
          if (newMsg !== lastLiveMessageRef.current) {
            lastLiveMessageRef.current = newMsg;
            stopListening();
            doSpeak(newMsg, () => { if (interviewRef.current?.interviewType === "VOICE") startListeningForAnswer(); });
          }
        }
        if (!data.interview.isLive && liveJoined) {
          setLiveJoined(false);
          doSpeak("Your interviewer has left. Please continue answering the remaining questions.", () => {
            if (interviewRef.current?.interviewType === "VOICE") startListeningForAnswer();
          });
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
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) { console.warn("Recording not available:", err); }
  };

  const stopAndUploadRecording = async (interviewId: string) => {
    if (!mediaRecorderRef.current) return;
    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        try {
          const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("recording", blob, "interview.webm");
          await fetch(`/api/recruiter/interviews/${interviewId}/recording`, {
            method: "POST", headers: { "x-share-token": token }, body: fd,
          });
        } catch {}
        finally { audioStreamRef.current?.getTracks().forEach((t) => t.stop()); resolve(); }
      };
      mediaRecorderRef.current!.stop();
    });
  };

  // ── Voice: confirm answer ──
  const handleVoiceConfirm = useCallback(async () => {
    if (!transcript.trim()) return;
    setConfirming(true);
    stopListening();
    const iv = interviewRef.current;
    const idx = currentIndexRef.current;
    const mainQuestions = iv.questions.filter((q: any) => !q.isFollowUp);
    const currentFollowUp = isFollowUpRef.current;
    const qId = currentFollowUp && followUpQuestionIdRef.current ? followUpQuestionIdRef.current : mainQuestions[idx]?.id;
    const ok = await submitAnswer(qId, transcript);
    setConfirming(false);
    if (!ok) { setTranscript(""); finalTranscriptRef.current = ""; return; }
    if (currentFollowUp) {
      setTranscript(""); finalTranscriptRef.current = "";
      setIsFollowUp(false); setFollowUpQuestion(null); setFollowUpQuestionId(null);
      isFollowUpRef.current = false; followUpQuestionRef.current = null; followUpQuestionIdRef.current = null;
      proceedToNext();
      return;
    }
    const shouldFollowUp = iv.allowFollowUps ? await checkFollowUp(qId, transcript) : false;
    setTranscript(""); finalTranscriptRef.current = "";
    if (shouldFollowUp) {
      const fq = followUpQuestionRef.current;
      if (fq) {
        setIsFollowUp(true); isFollowUpRef.current = true;
        setTimeout(() => { doSpeak(fq, () => { startListeningForAnswer(); }); }, 500);
      } else { proceedToNext(); }
    } else { proceedToNext(); }
  }, [transcript, submitAnswer, stopListening, proceedToNext, checkFollowUp, doSpeak, startListeningForAnswer]);

  // ── Voice: re-record ──
  const handleVoiceReRecord = useCallback(() => {
    setTranscript(""); finalTranscriptRef.current = "";
    const iv = interviewRef.current;
    const idx = currentIndexRef.current;
    const currentQ = isFollowUpRef.current && followUpQuestionRef.current
      ? followUpQuestionRef.current
      : iv?.questions?.filter((q: any) => !q.isFollowUp)[idx]?.question;
    if (currentQ) doSpeak(currentQ, () => { startListeningForAnswer(); });
  }, [doSpeak, startListeningForAnswer]);

  // ── Text: submit ──
  const handleTextSubmit = useCallback(async () => {
    if (!textAnswer.trim()) return;
    setSubmitting(true);
    const iv = interviewRef.current;
    const mainQuestions = iv.questions.filter((q: any) => !q.isFollowUp);
    const q = mainQuestions[currentIndexRef.current];
    const ok = await submitAnswer(q.id, textAnswer);
    setSubmitting(false);
    if (!ok) return;
    const shouldFollowUp = iv.allowFollowUps ? await checkFollowUp(q.id, textAnswer) : false;
    setTextAnswer("");
    setJustAnswered(true);
  }, [textAnswer, submitAnswer, checkFollowUp]);

  useEffect(() => {
    if (justAnswered && followUpQuestion && !pendingFollowUp) {
      setPendingFollowUp({ id: followUpQuestionId, question: followUpQuestion });
    }
  }, [justAnswered, followUpQuestion, pendingFollowUp, followUpQuestionId]);

  const handleTextAnswerFollowUp = useCallback(async () => {
    if (!followUpAnswer.trim() || !pendingFollowUp?.id) return;
    setSubmittingFollowUp(true);
    const ok = await submitAnswer(pendingFollowUp.id, followUpAnswer);
    setSubmittingFollowUp(false);
    if (!ok) return;
    setFollowUpAnswer(""); setPendingFollowUp(null); setFollowUpJustAnswered(true);
  }, [followUpAnswer, pendingFollowUp, submitAnswer]);

  const handleTextNextAfterFollowUp = useCallback(() => {
    setFollowUpJustAnswered(false); setJustAnswered(false);
    setFollowUpQuestion(null); setFollowUpQuestionId(null);
    const iv = interviewRef.current;
    const idx = currentIndexRef.current;
    const mainQuestions = iv.questions.filter((q: any) => !q.isFollowUp);
    const nextIndex = mainQuestions.findIndex((q: any, i: number) => i > idx && !q.answered && !q.skipped);
    if (nextIndex !== -1) { setCurrentIndex(nextIndex); currentIndexRef.current = nextIndex; }
    else endInterview();
  }, [endInterview]);

  const handleTextNext = useCallback(() => {
    setJustAnswered(false); setPendingFollowUp(null);
    setFollowUpQuestion(null); setFollowUpQuestionId(null);
    const iv = interviewRef.current;
    const idx = currentIndexRef.current;
    const mainQuestions = iv.questions.filter((q: any) => !q.isFollowUp);
    const nextIndex = mainQuestions.findIndex((q: any, i: number) => i > idx && !q.answered && !q.skipped);
    if (nextIndex !== -1) { setCurrentIndex(nextIndex); currentIndexRef.current = nextIndex; }
    else endInterview();
  }, [endInterview]);

  // ── Setup complete ──
  const handleSetupComplete = useCallback(async (
    selectedGender: "male" | "female" | "prefer-not-to-say",
    dob: string, paceValue: number, selectedVoiceId: string | null
  ) => {
    const pace = paceFromSlider(paceValue);
    genderRef.current = selectedGender;
    speechRateRef.current = pace.speechRate;
    silenceRepeatMsRef.current = pace.silenceRepeat;
    silenceSkipMsRef.current = pace.silenceSkip;
    if (selectedVoiceId) voiceIdRef.current = selectedVoiceId;
    setGender(selectedGender);
    setSetupDone(true);
    const iv = interviewRef.current;
    if (iv?.interviewType === "VOICE") await startRecording();
    setPhase("opening");
    const openingMsg = iv?.opening?.message
      || `Hi ${iv?.candidateName?.split(" ")[0] || ""}! Welcome to your interview${iv?.jobTitle ? ` for the ${iv.jobTitle} position` : ""}. I'm your AI interviewer today. Take your time, speak clearly, and answer as fully as you can. Let's begin.`;
    if (iv?.interviewType === "VOICE") {
      const go = () => {
        doSpeak(openingMsg, () => {
          setPhase("interview");
          const mainQuestions = iv.questions.filter((q: any) => !q.isFollowUp);
          const firstQ = mainQuestions[currentIndexRef.current];
          if (firstQ) setTimeout(() => { doSpeak(firstQ.question, () => { startListeningForAnswer(); }); }, 600);
        });
      };
      if (window.speechSynthesis.getVoices().length > 0 || voiceTierRef.current === "elevenlabs") {
        go();
      } else {
        window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; go(); };
        setTimeout(go, 2000);
      }
    } else {
      setPhase("interview");
    }
  }, [doSpeak, startListeningForAnswer]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-white font-bold text-xl mb-2">Interview Error</p>
        <p className="text-slate-400">{error}</p>
      </div>
    </div>
  );
  if (!interview) return null;

  if (!setupDone) {
    return (
      <SetupScreen
        candidateName={interview.candidateName}
        jobTitle={interview.jobTitle}
        companyName={interview.companyName}
        interviewType={interview.interviewType}
        voiceTier={interview.voiceTier || "web-speech"}
        defaultVoiceId={interview.voiceId}
        onStart={handleSetupComplete}
      />
    );
  }

  if (interview.interviewType === "VOICE") {
    return (
      <VoiceCallScreen
        interview={interview} currentIndex={currentIndex}
        isAISpeaking={isAISpeaking} isListening={isListening}
        transcript={transcript} silencePhase={silencePhase}
        onConfirm={handleVoiceConfirm} onReRecord={handleVoiceReRecord}
        onSkip={handleSkipQuestion} confirming={confirming} phase={phase}
        liveJoined={liveJoined} isFollowUp={isFollowUp} followUpQuestion={followUpQuestion}
      />
    );
  }

  return (
    <TextInterviewScreen
      interview={interview} currentIndex={currentIndex}
      answer={textAnswer} setAnswer={setTextAnswer}
      onSubmit={handleTextSubmit} submitting={submitting}
      onNext={handleTextNext} justAnswered={justAnswered}
      setCurrentIndex={(i) => { setCurrentIndex(i); currentIndexRef.current = i; }}
      setJustAnswered={setJustAnswered} phase={phase}
      pendingFollowUp={pendingFollowUp} onAnswerFollowUp={handleTextAnswerFollowUp}
      followUpAnswer={followUpAnswer} setFollowUpAnswer={setFollowUpAnswer}
      submittingFollowUp={submittingFollowUp} followUpJustAnswered={followUpJustAnswered}
      onNextAfterFollowUp={handleTextNextAfterFollowUp}
    />
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>}>
      <InterviewSession />
    </Suspense>
  );
}
