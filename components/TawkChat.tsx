"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export default function TawkChat() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const hideOnPages = ["/signin", "/signup", "/forgot-password"];
  const shouldHide = hideOnPages.some((page) => pathname?.startsWith(page));

  useEffect(() => {
    if (shouldHide) return;

    const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

    if (!propertyId || !widgetId) {
      console.warn("⚠️ Tawk.to IDs not configured");
      return;
    }

    if (document.getElementById("tawk-script")) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = "tawk-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);

    window.Tawk_API.onLoad = function () {
      if (session?.user) {
        const user = session.user as any;
        const isPremium = user?.isPremium || false;

        window.Tawk_API.setAttributes(
          {
            name: user.name || "User",
            email: user.email || "",
            plan: isPremium ? "Premium ⭐" : "Free",
            userId: user.id || "",
          },
          function (error: any) {
            if (error) console.error("Tawk error:", error);
          }
        );

        if (isPremium) {
          window.Tawk_API.addTags(
            ["premium", "priority"],
            function (error: any) {
              if (error) console.error("Tawk tag error:", error);
            }
          );
        }
      }
    };
  }, [session, shouldHide]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldHide && window.Tawk_API?.hideWidget) {
      window.Tawk_API.hideWidget();
    } else if (!shouldHide && window.Tawk_API?.showWidget) {
      window.Tawk_API.showWidget();
    }
  }, [shouldHide]);

  return null;
}