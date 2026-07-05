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

  // Public routes
  const publicRoutes = ["/", "/pricing", "/privacy", "/terms", "/contact"];
  if (publicRoutes.includes(pathname)) return NextResponse.next();

  // Auth routes
  const authRoutes = ["/signin", "/signup", "/forgot-password"];
  if (authRoutes.includes(pathname)) {
    if (token) {
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
      if (role === "STAFF") return NextResponse.redirect(new URL("/staff", request.url));
      if (role === "SUPPORT") return NextResponse.redirect(new URL("/support", request.url));
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/signin", request.url));
    return NextResponse.next();
  }

  // Staff routes
  if (pathname.startsWith("/staff")) {
    if (!["STAFF", "ADMIN"].includes(role)) return NextResponse.redirect(new URL("/signin", request.url));
    return NextResponse.next();
  }

  // Support routes
  if (pathname.startsWith("/support")) {
    if (!["SUPPORT", "ADMIN"].includes(role)) return NextResponse.redirect(new URL("/signin", request.url));
    return NextResponse.next();
  }

  // Premium routes
  const premiumRoutes = [
    "/dashboard/interview",
    "/dashboard/career",
    "/dashboard/chat",
    "/dashboard/messages",
  ];
  if (premiumRoutes.some((route) => pathname.startsWith(route))) {
    if (!["PREMIUM", "ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard?upgrade=true", request.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/dashboard?guest=true", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};