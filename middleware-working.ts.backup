// middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

  const { pathname } = request.nextUrl;

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

  // Define route categories
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
  ];

  const parentRoutes = [
    "/parent/dashboard",
    "/parent/student",
    "/parent/students",
    "/parent/finances",
    "/parent/applications",
    "/parent/profile",
  ];

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
