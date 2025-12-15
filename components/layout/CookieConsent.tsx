"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    closeBanner();
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowBanner(false);
      setIsClosing(false);
    }, 300);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop - REMOVED onClick so users can't close by clicking outside */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[999] transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Cookie Banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[1000] transition-transform duration-300 ${
          isClosing ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="bg-card border-2 border-primary/20 rounded-lg shadow-2xl p-6 md:p-8 relative">
            {/* Required Choice Badge
            <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
              Action Required
            </div> */}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      We Value Your Privacy
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We use cookies to improve your experience on our website,
                      analyze site traffic, and provide personalized content.
                      Please choose whether you accept or decline our use of
                      cookies.
                    </p>
                    <div className="mt-3">
                      <Link
                        href="/cookies"
                        target="_blank"
                        className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Learn more about our cookie policy
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={declineCookies}
                  className="px-6 py-3 rounded-lg border-2 border-border hover:border-primary/50 font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Decline All
                </button>
                <button
                  onClick={acceptCookies}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors shadow-lg text-sm whitespace-nowrap"
                >
                  Accept All Cookies
                </button>
              </div>
            </div>

            {/* Cookie Types Info */}
            <div className="mt-6 pt-6 border-t border-border">
              <details className="group">
                <summary className="text-sm font-medium cursor-pointer hover:text-primary transition-colors flex items-center gap-2">
                  <svg
                    className="w-4 h-4 transition-transform group-open:rotate-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  What cookies do we use?
                </summary>
                <div className="mt-4 pl-6 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        Essential Cookies:
                      </span>{" "}
                      Required for the website to function properly (login,
                      security, navigation).
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        Analytics Cookies:
                      </span>{" "}
                      Help us understand visitor behavior to improve our website
                      (Google Analytics).
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        Preference Cookies:
                      </span>{" "}
                      Remember your settings like dark mode and language
                      preferences.
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Privacy Notice */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                🔒 We respect your privacy. Your choice will be saved and you
                can change it anytime by visiting our{" "}
                <Link
                  href="/cookies"
                  target="_blank"
                  className="text-primary hover:underline font-medium"
                >
                  Cookie Policy
                </Link>{" "}
                page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
