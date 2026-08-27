"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecruiterTourPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("tomparo_recruiter_tour_done");
    router.replace("/recruiter");
  }, [router]);

  return null;
}
