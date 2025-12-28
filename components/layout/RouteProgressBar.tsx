"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: "ease",
  speed: 500,
});

export default function RouteProgressBar() {
  const pathname = usePathname();

  useEffect(() => {
    // Complete progress bar when route changes
    NProgress.done();
  }, [pathname]);

  useEffect(() => {
    // Start progress on link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.href.startsWith("#")) {
        // Check if it's an internal link
        const currentUrl = new URL(window.location.href);
        const linkUrl = new URL(link.href);

        // Only trigger for same-origin navigation
        if (currentUrl.origin === linkUrl.origin) {
          // 🔧 FIX: Check if clicking the same page
          const currentPath = currentUrl.pathname;
          const targetPath = linkUrl.pathname;

          if (currentPath === targetPath) {
            // Same page - don't start progress bar
            return;
          }

          // Different page - start progress bar
          NProgress.start();
        }
      }
    };

    // Start progress on browser back/forward
    const handlePopState = () => {
      NProgress.start();
    };

    // Add event listeners
    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname]); // 🔧 Added pathname as dependency

  return null;
}
