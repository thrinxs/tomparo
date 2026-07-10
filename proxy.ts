import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const role = (token?.role as string) || "GUEST";
  const isRecruiter = (token as any)?.isRecruiter as boolean | undefined;

  // ── Public routes ──────────────────────────────────────────────────────────
  const publicRoutes = [
    "/",
    "/pricing",
    "/recruiter-pricing",
    "/privacy",
    "/terms",
    "/contact",
    "/about",
    "/how-it-works",
    "/faq",
    "/success-stories",
    "/jobs", 
  ];
  if (publicRoutes.includes(pathname)) return NextResponse.next();

  // ── Auth routes ────────────────────────────────────────────────────────────
  const authRoutes = ["/signin", "/signup", "/forgot-password"];
  if (authRoutes.includes(pathname)) {
    if (token) {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (role === "STAFF") {
        return NextResponse.redirect(new URL("/staff", request.url));
      }
      if (role === "SUPPORT") {
        return NextResponse.redirect(new URL("/support", request.url));
      }
      if (
        [
          "RECRUITER_STARTER",
          "RECRUITER_GROWTH",
          "RECRUITER_BUSINESS",
          "RECRUITER_ENTERPRISE",
          "RECRUITER_SCALE",
          "RECRUITER_CUSTOM",
        ].includes(role) || isRecruiter
      ) {
        return NextResponse.redirect(new URL("/recruiter", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── Admin routes ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }
  // Jobs pages are public
if (pathname.startsWith("/jobs")) {
  return NextResponse.next();
}

  // ── Staff routes ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/staff")) {
    if (!["STAFF", "ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  // ── Support routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/support")) {
    if (!["SUPPORT", "ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  // ── Recruiter routes ───────────────────────────────────────────────────────
  if (
    pathname.startsWith("/recruiter") &&
    !pathname.startsWith("/recruiter-pricing")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    const hasRecruiterAccess =
      [
        "FREE",
        "RECRUITER_STARTER",
        "RECRUITER_GROWTH",
        "RECRUITER_BUSINESS",
        "RECRUITER_ENTERPRISE",
        "RECRUITER_SCALE",
        "RECRUITER_CUSTOM",
        "ADMIN",
      ].includes(role) || isRecruiter;

    if (!hasRecruiterAccess) {
      return NextResponse.redirect(new URL("/recruiter-pricing", request.url));
    }
    return NextResponse.next();
  }

  // ── Premium routes — allow access, show locked screen internally ───────────
  const premiumRoutes = [
    "/dashboard/interview",
    "/dashboard/career",
    "/dashboard/chat",
    "/dashboard/messages",
  ];
  if (premiumRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }
  // ── Jobs pages are public ──────────────────────────────────────────────────
if (pathname.startsWith("/jobs")) {
  return NextResponse.next();
}
if (pathname.startsWith("/api/track")) {
  return NextResponse.next();
}

  // ── Dashboard routes ───────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    // Safety net — recruiters should never land on job seeker dashboard
    if (
      token &&
      (
        [
          "RECRUITER_STARTER",
          "RECRUITER_GROWTH",
          "RECRUITER_BUSINESS",
          "RECRUITER_ENTERPRISE",
          "RECRUITER_SCALE",
          "RECRUITER_CUSTOM",
        ].includes(role) || isRecruiter
      )
    ) {
      return NextResponse.redirect(new URL("/recruiter", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};