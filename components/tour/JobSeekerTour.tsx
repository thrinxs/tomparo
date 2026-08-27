"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import TourBubble, { BubblePosition } from "./TourBubble";

const TOUR_KEY = "tomparo_jobseeker_tour_done";
const BUBBLE_WIDTH = 288;
const BUBBLE_HEIGHT = 200;

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
      "This quick tour will show you the key features of your dashboard. It takes less than a minute. You can close it anytime by clicking ×.",
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
      "TomParo writes a tailored cover letter and application email for any role. You can edit them and download as DOCX, ready to send.",
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
      "Every CV analysis, job match, and application you've generated is saved here. Go back, review, and track your progress over time.",
  },
  {
    targetId: "nav-settings",
    feature: "Settings",
    title: "Your Account Settings",
    description:
      "Update your profile, change your password, manage your subscription, or delete your account — all from one place.",
  },
];

function getPosition(targetId: string | null): BubblePosition {
  if (!targetId) {
    return {
      top: window.innerHeight / 2 - BUBBLE_HEIGHT / 2,
      left: window.innerWidth / 2 - BUBBLE_WIDTH / 2,
      pointerSide: "none",
      pointerOffset: 0,
    };
  }

  const el = document.getElementById(targetId);
  if (!el) {
    return {
      top: window.innerHeight / 2 - BUBBLE_HEIGHT / 2,
      left: window.innerWidth / 2 - BUBBLE_WIDTH / 2,
      pointerSide: "none",
      pointerOffset: 0,
    };
  }

  const rect = el.getBoundingClientRect();
  const elCenterY = rect.top + rect.height / 2;
  const elCenterX = rect.left + rect.width / 2;
  const padding = 12;

  const spaceRight = window.innerWidth - rect.right;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const spaceLeft = rect.left;

  if (spaceRight > BUBBLE_WIDTH + padding) {
    return {
      top: Math.max(8, Math.min(window.innerHeight - BUBBLE_HEIGHT - 8, elCenterY - BUBBLE_HEIGHT / 2)),
      left: rect.right + padding,
      pointerSide: "left",
      pointerOffset: Math.max(16, Math.min(BUBBLE_HEIGHT - 32, elCenterY - Math.max(8, elCenterY - BUBBLE_HEIGHT / 2))),
    };
  }

  if (spaceBelow > BUBBLE_HEIGHT + padding) {
    return {
      top: rect.bottom + padding,
      left: Math.max(8, Math.min(window.innerWidth - BUBBLE_WIDTH - 8, elCenterX - BUBBLE_WIDTH / 2)),
      pointerSide: "top",
      pointerOffset: Math.max(16, Math.min(BUBBLE_WIDTH - 32, elCenterX - Math.max(8, elCenterX - BUBBLE_WIDTH / 2))),
    };
  }

  if (spaceAbove > BUBBLE_HEIGHT + padding) {
    return {
      top: rect.top - BUBBLE_HEIGHT - padding,
      left: Math.max(8, Math.min(window.innerWidth - BUBBLE_WIDTH - 8, elCenterX - BUBBLE_WIDTH / 2)),
      pointerSide: "bottom",
      pointerOffset: Math.max(16, Math.min(BUBBLE_WIDTH - 32, elCenterX - Math.max(8, elCenterX - BUBBLE_WIDTH / 2))),
    };
  }

  if (spaceLeft > BUBBLE_WIDTH + padding) {
    return {
      top: Math.max(8, Math.min(window.innerHeight - BUBBLE_HEIGHT - 8, elCenterY - BUBBLE_HEIGHT / 2)),
      left: rect.left - BUBBLE_WIDTH - padding,
      pointerSide: "right",
      pointerOffset: Math.max(16, Math.min(BUBBLE_HEIGHT - 32, elCenterY - Math.max(8, elCenterY - BUBBLE_HEIGHT / 2))),
    };
  }

  return {
    top: window.innerHeight / 2 - BUBBLE_HEIGHT / 2,
    left: window.innerWidth / 2 - BUBBLE_WIDTH / 2,
    pointerSide: "none",
    pointerOffset: 0,
  };
}

interface Props {
  forceShow?: boolean;
  onClose?: () => void;
}

export default function JobSeekerTour({ forceShow = false, onClose }: Props) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<BubblePosition>({
    top: 0, left: 0, pointerSide: "none", pointerOffset: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    if (forceShow) {
      const t = setTimeout(() => {
        setStep(0);
        setActive(true);
      }, 400);
      return () => clearTimeout(t);
    }

    // Wait for sidebar to fully render before checking
    const t = setTimeout(() => {
      const done = localStorage.getItem(TOUR_KEY);
      if (!done) {
        setStep(0);
        setActive(true);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [forceShow, mounted]);

  const updatePosition = useCallback(() => {
    if (!active) return;
    const current = STEPS[step];
    setPosition(getPosition(current.targetId));
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
    if (finished) {
      localStorage.setItem(TOUR_KEY, "true");
    }
    onClose?.();
  };

  if (!mounted || !active) return null;

  const current = STEPS[step];

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[1px]"
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
