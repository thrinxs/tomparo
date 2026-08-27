"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import TourBubble, { BubblePosition } from "./TourBubble";

const TOUR_KEY = "tomparo_jobseeker_tour_done";
const BUBBLE_W = 288;
const BUBBLE_H = 210;
const GAP = 14;

type TourStep = {
  targetId: string | null;
  feature: string;
  title: string;
  description: string;
};

const STEPS: TourStep[] = [
  {
    targetId: null,
    feature: "Welcome",
    title: "Welcome to TomParo! 👋",
    description:
      "This quick tour shows you the key features of your dashboard. Takes less than a minute. Close anytime by clicking ×.",
  },
  {
    targetId: "nav-resume",
    feature: "CV Analysis",
    title: "Analyse Your CV",
    description:
      "Upload your CV (PDF, DOC, or DOCX) and get an ATS score, strengths, weaknesses, missing keywords, and quick wins — all powered by AI.",
  },
  {
    targetId: "nav-job",
    feature: "Job Matching",
    title: "Match a Job Description",
    description:
      "Paste any job description and see exactly how well your CV matches it. You'll get a match score, skills gap, and specific advice on what to improve.",
  },
  {
    targetId: "nav-apply",
    feature: "Applications",
    title: "Generate Cover Letters & Emails",
    description:
      "TomParo writes a tailored cover letter and application email for any role. Edit them and download as DOCX, ready to send.",
  },
  {
    targetId: "nav-skills",
    feature: "Skill Gap",
    title: "Skill Gap Analysis",
    description:
      "Find out which skills you're missing for your target role. Get a personalised learning roadmap with resources to close those gaps fast.",
  },
  {
    targetId: "nav-interview",
    feature: "Interview Coach",
    title: "AI Interview Coaching",
    description:
      "Practice with AI-generated interview questions tailored to your role and level. Premium feature — upgrade to unlock full coaching and feedback.",
  },
  {
    targetId: "nav-history",
    feature: "History",
    title: "Your Analysis History",
    description:
      "Every CV analysis, job match, and application you've generated is saved here. Review and track your progress over time.",
  },
  {
    targetId: "nav-settings",
    feature: "Settings",
    title: "Your Account Settings",
    description:
      "Update your profile, change your password, manage your subscription, or delete your account — all from one place.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isMobile() {
  return window.innerWidth < 1024;
}

function getPosition(targetId: string | null): BubblePosition {
  // Welcome step — always center
  if (!targetId) {
    return {
      top: window.innerHeight / 2 - BUBBLE_H / 2,
      left: window.innerWidth / 2 - BUBBLE_W / 2,
      pointerSide: "none",
      pointerOffset: 0,
    };
  }

  const el = document.getElementById(targetId);
  if (!el) {
    // Element not found — center fallback
    return {
      top: window.innerHeight / 2 - BUBBLE_H / 2,
      left: window.innerWidth / 2 - BUBBLE_W / 2,
      pointerSide: "none",
      pointerOffset: 0,
    };
  }

  const rect = el.getBoundingClientRect();
  const elMidY = rect.top + rect.height / 2;
  const elMidX = rect.left + rect.width / 2;

  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft  = rect.left;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceRight >= BUBBLE_W + GAP) {
    const bubbleTop = clamp(elMidY - BUBBLE_H / 2, 8, window.innerHeight - BUBBLE_H - 8);
    return {
      top: bubbleTop,
      left: rect.right + GAP,
      pointerSide: "left",
      pointerOffset: clamp(elMidY - bubbleTop - 8, 12, BUBBLE_H - 24),
    };
  }

  if (spaceBelow >= BUBBLE_H + GAP) {
    const bubbleLeft = clamp(elMidX - BUBBLE_W / 2, 8, window.innerWidth - BUBBLE_W - 8);
    return {
      top: rect.bottom + GAP,
      left: bubbleLeft,
      pointerSide: "top",
      pointerOffset: clamp(elMidX - bubbleLeft - 8, 12, BUBBLE_W - 24),
    };
  }

  if (spaceAbove >= BUBBLE_H + GAP) {
    const bubbleLeft = clamp(elMidX - BUBBLE_W / 2, 8, window.innerWidth - BUBBLE_W - 8);
    return {
      top: rect.top - BUBBLE_H - GAP,
      left: bubbleLeft,
      pointerSide: "bottom",
      pointerOffset: clamp(elMidX - bubbleLeft - 8, 12, BUBBLE_W - 24),
    };
  }

  if (spaceLeft >= BUBBLE_W + GAP) {
    const bubbleTop = clamp(elMidY - BUBBLE_H / 2, 8, window.innerHeight - BUBBLE_H - 8);
    return {
      top: bubbleTop,
      left: rect.left - BUBBLE_W - GAP,
      pointerSide: "right",
      pointerOffset: clamp(elMidY - bubbleTop - 8, 12, BUBBLE_H - 24),
    };
  }

  return {
    top: window.innerHeight / 2 - BUBBLE_H / 2,
    left: window.innerWidth / 2 - BUBBLE_W / 2,
    pointerSide: "none",
    pointerOffset: 0,
  };
}

interface Props {
  forceShow?: boolean;
  onClose?: () => void;
  onOpenSidebar?: () => void;
  onCloseSidebar?: () => void;
}

export default function JobSeekerTour({
  forceShow = false,
  onClose,
  onOpenSidebar,
  onCloseSidebar,
}: Props) {
  const [active, setActive]   = useState(false);
  const [step, setStep]       = useState(0);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<BubblePosition>({
    top: 0, left: 0, pointerSide: "none", pointerOffset: 0,
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (forceShow) {
      const t = setTimeout(() => { setStep(0); setActive(true); }, 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      const done = localStorage.getItem(TOUR_KEY);
      if (!done) { setStep(0); setActive(true); }
    }, 1500);
    return () => clearTimeout(t);
  }, [forceShow, mounted]);

  const updatePosition = useCallback(() => {
    if (!active) return;
    const targetId = STEPS[step].targetId;

    // On mobile with a targetId — open sidebar first then position
    if (isMobile() && targetId) {
      onOpenSidebar?.();
      // Wait for sidebar animation to complete (300ms transition)
      setTimeout(() => {
        setPosition(getPosition(targetId));
      }, 350);
    } else {
      setPosition(getPosition(targetId));
    }
  }, [active, step, onOpenSidebar]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose(true);
    }
  };

  const handleClose = (finished = false) => {
    setActive(false);
    // Close sidebar on mobile when tour ends
    if (isMobile()) onCloseSidebar?.();
    if (finished) localStorage.setItem(TOUR_KEY, "true");
    onClose?.();
  };

  if (!mounted || !active) return null;

  const current = STEPS[step];

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/25"
        onClick={() => handleClose()}
      />
      <TourBubble
        step={step + 1}
        total={STEPS.length}
        feature={current.feature}
        title={current.title}
        description={current.description}
        position={position}
        onNext={handleNext}
        onClose={() => handleClose()}
        isLast={step === STEPS.length - 1}
      />
    </>,
    document.body
  );
}
