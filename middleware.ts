import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // ==========================================
  // ENVIRONMENT DETECTION
  // ==========================================
  const isLocalhost =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");

  const isPublicDomain =
    hostname === "ahic.vercel.app" || hostname === "www.al-hikmah.org";

  const isAdminDomain =
    hostname === "ahic-admin.vercel.app" || hostname === "admin.al-hikmah.org";

  const isParentDomain =
    hostname === "ahic-parent.vercel.app" ||
    hostname === "parent.al-hikmah.org";

  const isApi = pathname.startsWith("/api");
  const isAsset =
    pathname.startsWith("/_next") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|css|js)$/);

  if (isApi || isAsset) {
    return NextResponse.next();
  }

  // ==========================================
  // ROUTE DEFINITIONS
  // ==========================================
  const publicRoutes = [
    "/",
    "/home",
    "/about",
    "/contact",
    "/apply",
    "/gallery",
    "/faq",
    "/news",
    "/programs",
    "/privacy",
    "/terms",
    "/cookies",
  ];

  const adminRoutes = [
    "/dashboard",
    "/students",
    "/classes",
    "/attendance",
    "/reports",
    "/settings",
    "/fees",
    "/fines",
    "/applications",
    "/curriculum-assessment",
    "/messages",
    "/notifications",
    "/events",
    "/alerts",
    "/users",
  ];

  const parentRoutes = [
    "/parent/dashboard",
    "/parent/children",
    "/parent/finances",
    "/parent/messages",
    "/parent/notifications",
    "/parent/profile",
    "/parent/applications",
    "/parent/events",
    "/parent/inbox",
    "/parent/student",
  ];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));
  const isParentRoute = parentRoutes.some((r) => pathname.startsWith(r));

  // Login routes
  const isAdminLogin = pathname === "/login";
  const isParentLogin = pathname === "/parent/login";
  const isSetPassword = pathname === "/parent/set-password";

  // ==========================================
  // LOCALHOST → ALLOW EVERYTHING
  // ==========================================
  if (isLocalhost) {
    return NextResponse.next();
  }

  // ==========================================
  // PUBLIC DOMAIN (NO AUTH, NO SUPABASE)
  // ==========================================
  if (isPublicDomain) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ==========================================
  // ADMIN DOMAIN – ROUTE GUARD ONLY (NO ROLE YET)
  // ==========================================
  if (isAdminDomain) {
    if (!(isAdminRoute || isAdminLogin)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ==========================================
  // PARENT DOMAIN – ROUTE GUARD ONLY (NO ROLE YET)
  // ==========================================
  if (isParentDomain) {
    if (!(isParentRoute || isParentLogin || isSetPassword)) {
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }
  }

  // ==========================================
  // AUTHENTICATION (ADMIN + PARENT ONLY)
  // ==========================================
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options: CookieOptions) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isAdminDomain) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isParentDomain) {
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }
  }

  let userRole: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    userRole = profile?.role ?? null;
  }

  // ==========================================
  // ROLE ENFORCEMENT
  // ==========================================
  if (isAdminDomain && isAdminRoute) {
    if (!["admin", "super_admin", "teacher"].includes(userRole || "")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (isParentDomain && isParentRoute) {
    if (userRole !== "parent") {
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }
  }

  // Redirect logged-in users away from login pages
  if (
    isAdminLogin &&
    ["admin", "super_admin", "teacher"].includes(userRole || "")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isParentLogin && userRole === "parent") {
    return NextResponse.redirect(new URL("/parent/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
