import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const role = (token?.role as string) || "GUEST";
  const isRecruiter = (token as any)?.isRecruiter as boolean | undefined;
  const isTeamMember = (token as any)?.isTeamMember as boolean | undefined;

  // ── Admin subdomain (admin.tomparo.com) ───────────────────────────────────
  const isAdminSubdomain =
    host === "admin.tomparo.com" ||
    host === "admin.localhost:3000"; // local testing

  if (isAdminSubdomain) {
    // Allow API routes and static files through
    if (pathname.startsWith("/api/")) return NextResponse.next();
    if (pathname.startsWith("/_next")) return NextResponse.next();

    // Always allow the login page — prevents redirect loop
    if (pathname === "/admin-login") return NextResponse.next();

    // Not logged in → admin login page
    if (!token) {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    // Logged in but not ADMIN role → admin login page
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    // ADMIN + on login page → go to dashboard
    if (pathname === "/admin-login" || pathname === "/") {
      // Check if admin code cookie is verified
      const adminVerified = request.cookies.get("admin_verified")?.value;
      if (adminVerified === "true") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      // Not verified yet — stay on login page
      if (pathname === "/admin-login") return NextResponse.next();
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    // ADMIN + going to /admin/* → check code cookie
    if (pathname.startsWith("/admin")) {
      const adminVerified = request.cookies.get("admin_verified")?.value;
      if (adminVerified !== "true") {
        return NextResponse.redirect(new URL("/admin-login", request.url));
      }
      return NextResponse.next();
    }

    // Allow preview routes on admin subdomain
    if (
      pathname.startsWith("/jobseeker_dashboard") ||
      pathname.startsWith("/recruiter_dashboard") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/recruiter")
    ) {
      const adminVerified = request.cookies.get("admin_verified")?.value;
      if (adminVerified !== "true") {
        return NextResponse.redirect(new URL("/admin-login", request.url));
      }
      return NextResponse.next();
    }

    // Anything else on admin subdomain → redirect to admin
    return NextResponse.redirect(new URL("/admin", request.url));
  }

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
        ].includes(role) || isRecruiter || isTeamMember
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

  // ── Jobs pages are public ──────────────────────────────────────────────────
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

  // ── Public candidate interview pages ──────────────────────────────────────
  if (pathname.startsWith("/interview/")) {
    return NextResponse.next();
  }

  // ── Recruiter routes ───────────────────────────────────────────────────────
  if (pathname.startsWith("/recruiter/invite/accept")) {
    return NextResponse.next();
  }

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
      ].includes(role) || isRecruiter || isTeamMember;

    if (!hasRecruiterAccess) {
      return NextResponse.redirect(new URL("/recruiter-pricing", request.url));
    }
    return NextResponse.next();
  }

  // ── Premium routes — allow access, gate internally ─────────────────────────
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

  if (pathname.startsWith("/api/track")) {
    return NextResponse.next();
  }

  // ── Dashboard routes ───────────────────────────────────────────────────────
  if (pathname.startsWith("/portfolio/")) return NextResponse.next();

  if (pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/signin", request.url));
    // ADMIN can visit dashboard freely for testing/support
    if (role === "ADMIN") return NextResponse.next();
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
        ].includes(role) || isRecruiter || isTeamMember
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
