"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import LockedFeature from "@/components/dashboard/LockedFeature";
import ResumeUploader from "@/components/resume/ResumeUploader";
import {
  MessageSquare,
  Briefcase,
  Users,
  Code,
  Zap,
  Clock,
  Sparkles,
  Loader2,
  Send,
  Trophy,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Lightbulb,
  Brain,
  Search,
  Target,
} from "lucide-react";

type QuestionType = "hr" | "technical" | "behavioral" | "mixed";
type Difficulty = "quick" | "standard" | "full";
type PageState = "setup" | "loading" | "interview" | "evaluating" | "complete";

export default function InterviewPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium || false;

  const [pageState, setPageState] = useState<PageState>("setup");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");

  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Loading progress states
  const [startProgress, setStartProgress] = useState(0);
  const [startStep, setStartStep] = useState(0);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalStep, setEvalStep] = useState(0);

  const startSteps = [
    { icon: Search, label: "Reading your CV", duration: 4 },
    { icon: Brain, label: "Understanding your background", duration: 5 },
    { icon: Target, label: "Crafting personalized questions", duration: 6 },
    { icon: Sparkles, label: "Finalizing interview", duration: 5 },
  ];

  const evalSteps = [
    { icon: Search, label: "Reading your answer", duration: 3 },
    { icon: Brain, label: "Analyzing content", duration: 4 },
    { icon: Target, label: "Evaluating relevance & clarity", duration: 4 },
    { icon: Sparkles, label: "Generating feedback", duration: 4 },
  ];

  const START_DURATION = 20;
  const EVAL_DURATION = 15;

  // Start interview loading animation
  useEffect(() => {
    if (pageState !== "loading") {
      setStartProgress(0);
      setStartStep(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min((elapsed / START_DURATION) * 100, 99);
      setStartProgress(newProgress);

      let accumulatedTime = 0;
      for (let i = 0; i < startSteps.length; i++) {
        accumulatedTime += startSteps[i].duration;
        if (elapsed < accumulatedTime) {
          setStartStep(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [pageState]);

  // Evaluation loading animation
  useEffect(() => {
    if (pageState !== "evaluating") {
      setEvalProgress(0);
      setEvalStep(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min((elapsed / EVAL_DURATION) * 100, 99);
      setEvalProgress(newProgress);

      let accumulatedTime = 0;
      for (let i = 0; i < evalSteps.length; i++) {
        accumulatedTime += evalSteps[i].duration;
        if (elapsed < accumulatedTime) {
          setEvalStep(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [pageState]);

  if (!isPremium) {
    return (
      <LockedFeature
        feature="AI Interview Coach"
        description="Practice with AI-generated interview questions and get real-time feedback to ace your next interview."
        icon={MessageSquare}
        color="rose"
        benefits={[
          "Unlimited mock interview sessions",
          "AI-generated questions specific to your role",
          "3 difficulty levels (Quick, Standard, Full)",
          "4 question types (HR, Technical, Behavioral, Mixed)",
          "Real-time feedback on every answer",
          "Detailed strengths and improvements analysis",
          "Interview Readiness Score",
          "Save all your practice sessions",
        ]}
      />
    );
  }

  const questionTypes = [
    { id: "mixed" as QuestionType, label: "Mixed", icon: Sparkles, description: "Balanced mix of all types" },
    { id: "hr" as QuestionType, label: "HR", icon: Users, description: "Personality & culture fit" },
    { id: "technical" as QuestionType, label: "Technical", icon: Code, description: "Skills & problem-solving" },
    { id: "behavioral" as QuestionType, label: "Behavioral", icon: Briefcase, description: "Past experiences (STAR)" },
  ];

  const difficulties = [
    { id: "quick" as Difficulty, label: "Quick", questions: 5, duration: "10-15 min", icon: Zap },
    { id: "standard" as Difficulty, label: "Standard", questions: 15, duration: "30-45 min", icon: Clock },
    { id: "full" as Difficulty, label: "Full", questions: 30, duration: "60-90 min", icon: Trophy },
  ];

  const startInterview = async () => {
    if (!resumeText || resumeText.length < 100) {
      toast.error("Please provide your CV first");
      return;
    }

    setPageState("loading");

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription || undefined,
          questionType,
          difficulty,
          jobTitle: jobTitle || "General Interview",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start");
      }

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setEvaluations([]);
      setPageState("interview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start");
      setPageState("setup");
    }
  };

  const submitAnswer = async () => {
    if (currentAnswer.trim().length < 20) {
      toast.error("Please provide a more detailed answer");
      return;
    }

    setPageState("evaluating");

    try {
      const currentQuestion = questions[currentIndex];

      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionIndex: currentIndex,
          question: currentQuestion.question,
          answer: currentAnswer,
          category: currentQuestion.category,
          jobContext: jobDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to evaluate");
      }

      const newEvals = [...evaluations];
      newEvals[currentIndex] = data.evaluation;
      setEvaluations(newEvals);
      setCurrentEvaluation(data.evaluation);
      setShowFeedback(true);
      setPageState("interview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to evaluate");
      setPageState("interview");
    }
  };

  const nextQuestion = () => {
    setCurrentAnswer("");
    setCurrentEvaluation(null);
    setShowFeedback(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPageState("complete");
    }
  };

  const restartInterview = () => {
    setPageState("setup");
    setResumeText("");
    setJobDescription("");
    setJobTitle("");
    setSessionId("");
    setQuestions([]);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setEvaluations([]);
    setCurrentEvaluation(null);
    setShowFeedback(false);
  };

  const overallScore =
    evaluations.length > 0
      ? Math.round(
          evaluations
            .filter((e) => e && typeof e.score === "number")
            .reduce((a, e) => a + e.score, 0) /
            evaluations.filter((e) => e && typeof e.score === "number").length
        )
      : 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-cyan-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const startSecondsRemaining = Math.max(
    0,
    Math.ceil(START_DURATION - (startProgress / 100) * START_DURATION)
  );

  const evalSecondsRemaining = Math.max(
    0,
    Math.ceil(EVAL_DURATION - (evalProgress / 100) * EVAL_DURATION)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Toaster position="top-right" />

      {/* SETUP */}
      {pageState === "setup" && (
        <div className="space-y-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400">
              <MessageSquare className="h-3 w-3" />
              AI Interview Coach
            </div>
            <h1 className="text-3xl font-bold text-white">Mock Interview</h1>
            <p className="mt-2 text-slate-400">
              Practice with AI-generated questions and get detailed feedback on every answer.
            </p>
          </div>

          {!resumeText && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-400 ring-1 ring-rose-500/20">
                  1
                </div>
                <h2 className="text-lg font-semibold text-white">Your CV</h2>
              </div>
              <ResumeUploader onAnalyze={setResumeText} isAnalyzing={false} />
            </div>
          )}

          {resumeText && (
            <>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm text-white">CV Ready ({resumeText.length.toLocaleString()} chars)</span>
                  </div>
                  <button onClick={() => setResumeText("")} className="text-xs text-slate-400 hover:text-white">
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Job Description (Optional - for job-specific questions)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here for targeted questions..."
                  className="h-32 w-full resize-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Question Type
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {questionTypes.map((type) => {
                    const Icon = type.icon;
                    const selected = questionType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setQuestionType(type.id)}
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-rose-500/30 bg-rose-500/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <Icon
                          className={`mb-2 h-5 w-5 ${
                            selected ? "text-rose-400" : "text-slate-500"
                          }`}
                        />
                        <div className={`text-sm font-medium ${selected ? "text-white" : "text-slate-400"}`}>
                          {type.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {type.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {difficulties.map((diff) => {
                    const Icon = diff.icon;
                    const selected = difficulty === diff.id;
                    return (
                      <button
                        key={diff.id}
                        onClick={() => setDifficulty(diff.id)}
                        className={`rounded-xl border p-4 text-center transition ${
                          selected
                            ? "border-rose-500/30 bg-rose-500/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <Icon
                          className={`mx-auto mb-2 h-6 w-6 ${
                            selected ? "text-rose-400" : "text-slate-500"
                          }`}
                        />
                        <div className={`text-sm font-medium ${selected ? "text-white" : "text-slate-400"}`}>
                          {diff.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {diff.questions} Qs • {diff.duration}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={startInterview}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 text-base font-medium text-white shadow-lg shadow-rose-700/25 transition hover:from-rose-500 hover:to-pink-500"
              >
                <Sparkles className="h-5 w-5" />
                Start Interview
                <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* LOADING (Starting Interview) */}
      {pageState === "loading" && (
        <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="absolute -rotate-90" width="128" height="128" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" stroke="rgb(30 41 59)" strokeWidth="8" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 - (startProgress / 100) * (2 * Math.PI * 56)}
                  className="stroke-rose-500 transition-all duration-100 ease-linear"
                />
              </svg>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{startSecondsRemaining}s</div>
                <div className="text-xs text-slate-500">remaining</div>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Preparing your interview
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Personalizing questions based on your background
            </p>
          </div>

          <div className="space-y-3">
            {startSteps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === startStep;
              const isComplete = i < startStep;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    isActive
                      ? "border-rose-500/30 bg-rose-500/10"
                      : isComplete
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-white/5 bg-slate-900/40"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-rose-500/20 text-rose-400"
                        : isComplete
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-600"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isActive ? (
                      <StepIcon className="h-4 w-4 animate-pulse" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-white"
                        : isComplete
                          ? "text-emerald-300"
                          : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EVALUATING (After Submitting Answer) */}
      {pageState === "evaluating" && (
        <div className="space-y-6">
          {/* Progress at top */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-rose-400">
                {Math.round(((currentIndex + 1) / questions.length) * 100)}% complete
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question (still visible) */}
          <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-pink-500/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs uppercase text-rose-400">
                {questions[currentIndex]?.category}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              {questions[currentIndex]?.question}
            </h2>
          </div>

          {/* Evaluation Loading */}
          <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
            <div className="mb-8 flex flex-col items-center">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="absolute -rotate-90" width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" stroke="rgb(30 41 59)" strokeWidth="8" fill="none" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 - (evalProgress / 100) * (2 * Math.PI * 56)}
                    className="stroke-rose-500 transition-all duration-100 ease-linear"
                  />
                </svg>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{evalSecondsRemaining}s</div>
                  <div className="text-xs text-slate-500">remaining</div>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                Analyzing your answer
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                AI is providing detailed feedback and scoring
              </p>
            </div>

            <div className="space-y-3">
              {evalSteps.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === evalStep;
                const isComplete = i < evalStep;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                      isActive
                        ? "border-rose-500/30 bg-rose-500/10"
                        : isComplete
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-white/5 bg-slate-900/40"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-rose-500/20 text-rose-400"
                          : isComplete
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-800 text-slate-600"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isActive ? (
                        <StepIcon className="h-4 w-4 animate-pulse" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-white"
                          : isComplete
                            ? "text-emerald-300"
                            : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW */}
      {pageState === "interview" && questions.length > 0 && (
        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-rose-400">
                {Math.round(((currentIndex + 1) / questions.length) * 100)}% complete
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-pink-500/5 p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs uppercase text-rose-400">
                {questions[currentIndex].category}
              </span>
              <span className="text-xs text-slate-500">
                {questions[currentIndex].timeToAnswer}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              {questions[currentIndex].question}
            </h2>
            {questions[currentIndex].tips && (
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-sm text-slate-300">
                    <strong className="text-amber-400">Tip:</strong>{" "}
                    {questions[currentIndex].tips}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Answer or Feedback */}
          {!showFeedback ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Your Answer
                </label>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="h-64 w-full resize-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-rose-500/50"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{currentAnswer.length} characters</span>
                  <span>{currentAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>

              <button
                onClick={submitAnswer}
                disabled={currentAnswer.trim().length < 20}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-rose-700/25 transition hover:from-rose-500 hover:to-pink-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Submit Answer
              </button>
            </>
          ) : (
            currentEvaluation && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Your Score</h3>
                    <div className={`text-5xl font-bold ${getScoreColor(currentEvaluation.score)}`}>
                      {currentEvaluation.score}/100
                    </div>
                  </div>

                  <p className="text-slate-300">{currentEvaluation.feedback}</p>

                  {currentEvaluation.scoreBreakdown && (
                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {Object.entries(currentEvaluation.scoreBreakdown).map(([key, value]: any) => (
                        <div key={key} className="rounded-xl border border-white/5 bg-slate-900/40 p-3 text-center">
                          <div className={`text-xl font-bold ${getScoreColor(value)}`}>{value}</div>
                          <div className="mt-1 text-xs capitalize text-slate-500">{key}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {currentEvaluation.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-emerald-400">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      Improvements
                    </h4>
                    <ul className="space-y-2">
                      {currentEvaluation.improvements.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-amber-400">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-400">
                    <Sparkles className="h-4 w-4" />
                    Improved Answer Example
                  </h4>
                  <p className="text-sm text-slate-300">{currentEvaluation.improvedAnswer}</p>
                </div>

                <button
                  onClick={nextQuestion}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-rose-700/25 transition hover:from-rose-500 hover:to-pink-500"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      View Results
                      <Trophy className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* COMPLETE */}
      {pageState === "complete" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-pink-500/5 p-12 text-center">
            <Trophy className="mx-auto mb-4 h-16 w-16 text-amber-400" />
            <h2 className="text-3xl font-bold text-white">Interview Complete! 🎉</h2>
            <p className="mt-2 text-slate-400">
              You answered {questions.length} questions
            </p>

            <div className="my-8">
              <div className="text-sm text-slate-500">Interview Readiness Score</div>
              <div className={`mt-2 text-7xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="mt-1 text-sm text-slate-400">out of 100</div>
            </div>

            <button
              onClick={restartInterview}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-rose-700/25 transition hover:from-rose-500 hover:to-pink-500"
            >
              <RotateCcw className="h-4 w-4" />
              Practice Again
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Your Performance</h3>
            <div className="space-y-3">
              {evaluations.map((evaluation, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/40 p-4">
                  <div className="flex-1">
                    <div className="text-sm text-slate-400">Question {i + 1}</div>
                    <div className="mt-1 text-sm text-white">
                      {questions[i]?.question.slice(0, 80)}...
                    </div>
                  </div>
                  {evaluation && (
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.score)}`}>
                      {evaluation.score}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}