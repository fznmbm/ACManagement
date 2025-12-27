import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";

const PublicMobileMenu = dynamic(
  () =>
    import("@/components/layout/PublicMobileMenu").then((mod) => ({
      default: mod.PublicMobileMenu,
    })),
  { ssr: false }
);

export async function PublicHeader() {
  // Check if user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dashboardUrl = null;
  let dashboardLabel = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "parent") {
      dashboardUrl = "/parent/dashboard";
      dashboardLabel = "Parent Portal";
    } else if (
      ["admin", "super_admin", "teacher"].includes(profile?.role || "")
    ) {
      dashboardUrl = "/dashboard";
      dashboardLabel = "Admin Portal";
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Name */}
          <Link href="/home" className="flex items-center space-x-3">
            <Image
              src="https://raw.githubusercontent.com/fznmbm/ACManagement/refs/heads/main/public/logo/ahlogo_web_nobg.png"
              alt="Al Hikmah Institute Crawley Logo"
              width={72}
              height={72}
              className="h-20 w-20 rounded-lg"
              priority
              loading="eager"
            />

            <div className="hidden md:block">
              <div className="text-lg font-bold text-foreground">
                Al Hikmah Institute Crawley
              </div>
              <div className="text-xs text-muted-foreground">
                Islamic Education Centre
              </div>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/home"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/programs"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Programs
            </Link>
            <Link
              href="/gallery"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/news"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              News
            </Link>
            <Link
              href="/faq"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/apply"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Apply Now
            </Link>

            {/* Dashboard Button - Only show if logged in */}
            {dashboardUrl && (
              <Link
                href={dashboardUrl}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                {dashboardLabel}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <PublicMobileMenu
              dashboardUrl={dashboardUrl}
              dashboardLabel={dashboardLabel}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
