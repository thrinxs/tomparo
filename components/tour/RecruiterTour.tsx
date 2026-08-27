"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import TourBubble, { BubblePosition } from "./TourBubble";

const TOUR_KEY = "tomparo_recruiter_tour_done";
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
    title: "Welcome to TomParo Recruiter! 👋",
    description:
      "This quick tour walks you through the key features of your recruiter dashboard. Takes less than 2 minutes. Close anytime by clicking ×.",
  },
  {
    targetId: "rec-nav-upload",
    feature: "CV Upload",
    title: "Upload & Analyse CVs",
    description:
      "Upload a candidate's CV and get an instant AI-powered analysis — skills, experience, ATS score, and fit for your open roles.",
  },
  {
    targetId: "rec-nav-jobs",
    feature: "Job Postings",
    title: "Post & Manage Jobs",
    description:
      "Create job listings, set requirements, and manage applications. Your plan determines how many active jobs you can post.",
  },
  {
    targetId: "rec-nav-candidates",
    feature: "Candidates",
    title: "Candidate Database",
    description:
      "All your candidates in one place. Filter, shortlist, reject, or move candidates through your hiring pipeline.",
  },
  {
    targetId: "rec-nav-pipeline",
    feature: "Pipeline",
    title: "Hiring Pipeline",
    description:
      "Visual Kanban board for your hiring process. Drag candidates through stages — Applied, Shortlisted, Interview, Offer, Hired.",
  },
  {
    targetId: "rec-nav-emails",
    feature: "AI Emails",
    title: "AI-Written Emails",
    description:
      "Send interview invites, rejection letters, and follow-ups — all written by AI in seconds. Bulk send to multiple candidates at once.",
  },
  {
    targetId: "rec-nav-interviews",
    feature: "AI Interviews",
    title: "AI Interview System",
    description:
      "Set up automated AI interviews (text, voice, or video). Candidates complete them on their own time — you review scored results.",
  },
  {
    targetId: "rec-nav-team",
    feature: "Team",
    title: "Team Collaboration",
    description:
      "Invite colleagues to your recruiter account. Assign roles, share candidates, collaborate in the conference room, and manage tasks together.",
  },
  {
    targetId: "rec-nav-analytics",
    feature: "Analytics",
    title: "Hiring Analytics",
    description:
      "Track your hiring funnel — CVs analysed, jobs posted, candidates shortlisted, time-to-hire, and more. Business plan and above.",
  },
  {
    targetId: "rec-nav-settings",
    feature: "Settings",
    title: "Account Settings",
    description:
      "Configure your company profile, manage your subscription, set up interview templates, and control team permissions.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isMobile() {
  return window.innerWidth < 1024;
}

function getPosition(targetId: string | null): BubblePosition {
  // On mobile — always center bottom (sidebar is hidden)
  if (isMobile()) {
    return {
      top: window.innerHeight - BUBBLE_H - 80,
      left: window.innerWidth / 2 - BUBBLE_W / 2,
      pointerSide: "none",
      pointerOffset: 0,
    };
  }

  // Welcome step — center
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

  // Prefer right (sidebar items are on the left)
  if (spaceRight >= BUBBLE_W + GAP) {
    const bubbleTop = clamp(elMidY - BUBBLE_H / 2, 8, window.innerHeight - BUBBLE_H - 8);
    const pointerOffset = clamp(elMidY - bubbleTop - 8, 12, BUBBLE_H - 24);
    return {
      top: bubbleTop,
      left: rect.right + GAP,
      pointerSide: "left",
      pointerOffset,
    };
  }

  if (spaceBelow >= BUBBLE_H + GAP) {
    const bubbleLeft = clamp(elMidX - BUBBLE_W / 2, 8, window.innerWidth - BUBBLE_W - 8);
    const pointerOffset = clamp(elMidX - bubbleLeft - 8, 12, BUBBLE_W - 24);
    return {
      top: rect.bottom + GAP,
      left: bubbleLeft,
      pointerSide: "top",
      pointerOffset,
    };
  }

  if (spaceAbove >= BUBBLE_H + GAP) {
    const bubbleLeft = clamp(elMidX - BUBBLE_W / 2, 8, window.innerWidth - BUBBLE_W - 8);
    const pointerOffset = clamp(elMidX - bubbleLeft - 8, 12, BUBBLE_W - 24);
    return {
      top: rect.top - BUBBLE_H - GAP,
      left: bubbleLeft,
      pointerSide: "bottom",
      pointerOffset,
    };
  }

  if (spaceLeft >= BUBBLE_W + GAP) {
    const bubbleTop = clamp(elMidY - BUBBLE_H / 2, 8, window.innerHeight - BUBBLE_H - 8);
    const pointerOffset = clamp(elMidY - bubbleTop - 8, 12, BUBBLE_H - 24);
    return {
      top: bubbleTop,
      left: rect.left - BUBBLE_W - GAP,
      pointerSide: "right",
      pointerOffset,
    };
  }

  // Fallback center
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
}

export default function RecruiterTour({ forceShow = false, onClose }: Props) {
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
    setPosition(getPosition(STEPS[step].targetId));
  }, [active, step]);

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
