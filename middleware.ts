// middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  console.log("🌐 Middleware:", { hostname, pathname });

  // ==========================================
  // DEVELOPMENT MODE CHECK
  // ==========================================
  const isDevelopment =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");

  if (!isDevelopment) {
    // ==========================================
    // PRODUCTION: DOMAIN-BASED ROUTING
    // ==========================================

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
      //"/users",
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

    // ADMIN SUBDOMAIN
    if (isAdminDomain) {
      const isAdminRoute = adminRoutes.some((route) =>
        pathname.startsWith(route)
      );
      const isLogin = pathname === "/login";
      const isApi = pathname.startsWith("/api");
      const isAsset =
        pathname.startsWith("/_next") ||
        pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|css|js)$/);

      if (isAdminRoute || isLogin || isApi || isAsset) {
        // Continue
      } else {
        if (pathname === "/" || pathname === "/home") {
          return NextResponse.redirect(new URL("/login", request.url));
        }
        if (parentRoutes.some((route) => pathname.startsWith(route))) {
          return NextResponse.redirect(new URL("/login", request.url));
        }
        if (
          publicRoutes.some((route) => pathname === route) &&
          pathname !== "/"
        ) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        if (!isApi && !isAsset) {
          return NextResponse.redirect(new URL("/login", request.url));
        }
      }
    }

    // PARENT SUBDOMAIN
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

      if (isParentRoute || isParentLogin || isSetPassword || isApi || isAsset) {
        // Continue
      } else {
        if (pathname === "/" || pathname === "/home") {
          return NextResponse.redirect(new URL("/parent/login", request.url));
        }
        if (pathname === "/login") {
          return NextResponse.redirect(new URL("/parent/login", request.url));
        }
        if (adminRoutes.some((route) => pathname.startsWith(route))) {
          return NextResponse.redirect(new URL("/parent/login", request.url));
        }
        if (
          publicRoutes.some((route) => pathname === route) &&
          pathname !== "/"
        ) {
          return NextResponse.redirect(new URL("/parent/login", request.url));
        }
        if (!isApi && !isAsset) {
          return NextResponse.redirect(new URL("/parent/login", request.url));
        }
      }
    }

    // MAIN DOMAIN - PUBLIC ONLY
    if (isMainDomain) {
      if (adminRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      if (parentRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  // ==========================================
  // AUTHENTICATION & AUTHORIZATION
  // (Works in both development and production)
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    userRole = profile?.role || null;
  }

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
    //"/users",
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

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isParentRoute = parentRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminLogin = pathname === "/login";
  const isParentLogin = pathname === "/parent/login";
  const isSetPassword = pathname === "/parent/set-password";

  if (isSetPassword) {
    return response;
  }

  if (user && userRole) {
    if (isAdminLogin) {
      if (["admin", "super_admin", "teacher"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (userRole === "parent") {
        return NextResponse.redirect(new URL("/parent/dashboard", request.url));
      }
    }

    if (isParentLogin) {
      if (userRole === "parent") {
        return NextResponse.redirect(new URL("/parent/dashboard", request.url));
      }
      if (["admin", "super_admin", "teacher"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (
      userRole !== "admin" &&
      userRole !== "super_admin" &&
      userRole !== "teacher"
    ) {
      if (userRole === "parent") {
        return NextResponse.redirect(new URL("/parent/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (isParentRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }

    if (userRole !== "parent") {
      if (["admin", "super_admin", "teacher"].includes(userRole || "")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
