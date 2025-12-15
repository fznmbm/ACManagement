// middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ==========================================
  // STEP 1: DOMAIN-BASED ROUTING
  // ==========================================
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  console.log("🌐 Middleware:", { hostname, pathname });

  // Define all admin routes (COMPLETE LIST)
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
    "/communications",
  ];

  // Define all parent routes (COMPLETE LIST)
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

  // Define public routes
  const publicRoutes = [
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
    "/",
  ];

  const isAdminDomain =
    hostname.includes("ahic-admin") || hostname.startsWith("admin.");
  const isParentDomain =
    hostname.includes("ahic-parent") || hostname.startsWith("parent.");
  const isMainDomain = !isAdminDomain && !isParentDomain;

  // ADMIN SUBDOMAIN - ahic-admin.vercel.app OR admin.al-hikmah.org
  if (isAdminDomain) {
    const isAdminRoute = adminRoutes.some((route) =>
      pathname.startsWith(route)
    );
    const isLogin = pathname === "/login";
    const isApi = pathname.startsWith("/api");
    const isAsset =
      pathname.startsWith("/_next") ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|css|js)$/);

    // Allow admin routes, login, API, and assets
    if (isAdminRoute || isLogin || isApi || isAsset) {
      // Continue to authentication check
    } else {
      // Redirect root to login
      if (pathname === "/" || pathname === "/home") {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Block parent routes
      if (parentRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Block public pages (except login)
      if (
        publicRoutes.some((route) => pathname === route) &&
        pathname !== "/"
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Unknown route - redirect to login
      if (!isApi && !isAsset) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  // PARENT SUBDOMAIN - ahic-parent.vercel.app OR parent.al-hikmah.org
  if (isParentDomain) {
    const isParentRoute = parentRoutes.some((route) =>
      pathname.startsWith(route)
    );
    const isParentLogin = pathname === "/parent/login";
    const isSetPassword = pathname === "/parent/set-password";
    const isApi = pathname.startsWith("/api");
    const isAsset =
      pathname.startsWith("/_next") ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|css|js)$/);

    // Allow parent routes, login, API, and assets
    if (isParentRoute || isParentLogin || isSetPassword || isApi || isAsset) {
      // Continue to authentication check
    } else {
      // Redirect root to parent login
      if (pathname === "/" || pathname === "/home") {
        return NextResponse.redirect(new URL("/parent/login", request.url));
      }

      // Redirect /login to /parent/login
      if (pathname === "/login") {
        return NextResponse.redirect(new URL("/parent/login", request.url));
      }

      // Block admin routes
      if (adminRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/parent/login", request.url));
      }

      // Block public pages
      if (
        publicRoutes.some((route) => pathname === route) &&
        pathname !== "/"
      ) {
        return NextResponse.redirect(new URL("/parent/login", request.url));
      }

      // Unknown route - redirect to parent login
      if (!isApi && !isAsset) {
        return NextResponse.redirect(new URL("/parent/login", request.url));
      }
    }
  }

  // MAIN DOMAIN - ahic.vercel.app OR al-hikmah.org - PUBLIC ONLY
  if (isMainDomain) {
    // Block all admin routes on main domain
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Block all parent routes on main domain
    if (parentRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Allow /login for redirect purposes (will handle in auth section)
    // Allow /api routes
    // Allow public routes
    // Allow assets
  }

  // ==========================================
  // STEP 2: AUTHENTICATION & AUTHORIZATION
  // ==========================================
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user role if logged in
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    userRole = profile?.role || null;
  }

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isParentRoute = parentRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminLogin = pathname === "/login";
  const isParentLogin = pathname === "/parent/login";
  const isSetPassword = pathname === "/parent/set-password";

  // Allow set-password page without auth check
  if (isSetPassword) {
    return response;
  }

  // Handle login pages when user is already logged in
  if (user && userRole) {
    if (isAdminLogin) {
      // Admin/Teacher trying to access admin login
      if (["admin", "super_admin", "teacher"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Parent trying to access admin login - redirect to parent dashboard
      if (userRole === "parent") {
        return NextResponse.redirect(new URL("/parent/dashboard", request.url));
      }
    }

    if (isParentLogin) {
      // Parent trying to access parent login
      if (userRole === "parent") {
        return NextResponse.redirect(new URL("/parent/dashboard", request.url));
      }
      // Admin trying to access parent login - redirect to admin dashboard
      if (["admin", "super_admin", "teacher"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (
      userRole !== "admin" &&
      userRole !== "super_admin" &&
      userRole !== "teacher"
    ) {
      // Parent trying to access admin routes - redirect to parent dashboard
      if (userRole === "parent") {
        return NextResponse.redirect(new URL("/parent/dashboard", request.url));
      }
      // Unknown role - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect parent routes
  if (isParentRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }

    if (userRole !== "parent") {
      // Admin trying to access parent routes - redirect to admin dashboard
      if (["admin", "super_admin", "teacher"].includes(userRole || "")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Unknown role - redirect to parent login
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
