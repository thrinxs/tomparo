"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TourPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear the "done" flag so tour shows again
    localStorage.removeItem("tomparo_jobseeker_tour_done");
    // Go back to dashboard where the tour lives
    router.replace("/dashboard");
  }, [router]);

  return null;
}
