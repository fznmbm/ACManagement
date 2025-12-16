"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Menu,
  X,
  Home,
  Info,
  BookOpen,
  Mail,
  Phone,
  LogIn,
  Camera,
  Newspaper,
} from "lucide-react";

import { getDomainUrls } from "@/lib/utils/domains";

export function PublicMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const domains = getDomainUrls();

  // Ensure component is mounted (for SSR)
  useEffect(() => {
    setMounted(true);
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // Theme colors
  const colors = isDark
    ? {
        bg: "#0f172a", // slate-900
        text: "#f1f5f9", // slate-100
        textMuted: "#94a3b8", // slate-400
        border: "#334155", // slate-700
        hover: "#1e293b", // slate-800
        card: "#1e293b", // slate-800
      }
    : {
        bg: "#ffffff",
        text: "#000000",
        textMuted: "#6b7280",
        border: "#e5e7eb",
        hover: "#f3f4f6",
        card: "#f9fafb",
      };

  // The menu content that will be rendered in portal
  const menuContent = isOpen ? (
    <div
      className="fixed inset-0 md:hidden"
      style={{
        zIndex: 9999,
        top: "80px", // Below header
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className="absolute right-0 top-0 bottom-0 overflow-y-auto shadow-2xl"
        style={{
          width: "min(380px, 90vw)",
          maxWidth: "85vw",
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        <div style={{ padding: "24px", backgroundColor: colors.bg }}>
          {/* School Info */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "24px",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <h3
              style={{
                fontWeight: "700",
                fontSize: "16px",
                color: "#22c55e",
                marginBottom: "4px",
              }}
            >
              Al Hikmah Institute Crawley
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
              }}
            >
              Islamic Education Centre
            </p>
          </div>

          {/* Navigation Links */}
          <nav style={{ marginBottom: "32px" }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {[
                { href: "/home", icon: Home, label: "Home" },
                { href: "/about", icon: Info, label: "About Us" },
                { href: "/programs", icon: BookOpen, label: "Programs" },
                { href: "/gallery", icon: Camera, label: "Gallery" },
                { href: "/news", icon: Newspaper, label: "News" },
                { href: "/contact", icon: Mail, label: "Contact" },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={handleLinkClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    color: colors.text,
                    fontWeight: "500",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = colors.hover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <Icon
                    style={{
                      width: "20px",
                      height: "20px",
                      color: colors.textMuted,
                    }}
                  />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Apply Button */}
          <Link
            href="/apply"
            onClick={handleLinkClick}
            style={{
              display: "block",
              width: "100%",
              marginBottom: "24px",
              padding: "16px 24px",
              backgroundColor: "#22c55e",
              color: "#ffffff",
              fontWeight: "600",
              textAlign: "center",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Apply Now for 2025-2026
          </Link>

          {/* Divider */}
          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              margin: "24px 0",
            }}
          />

          {/* Parent Portal */}
          <div style={{ marginBottom: "24px" }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: colors.text,
                marginBottom: "12px",
                paddingLeft: "16px",
              }}
            >
              For Parents
            </p>
            <Link
              href={`${domains.parent}/parent/login`}
              onClick={handleLinkClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                color: "#22c55e",
                fontWeight: "500",
                borderRadius: "8px",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                textDecoration: "none",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "rgba(34, 197, 94, 0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <LogIn style={{ width: "20px", height: "20px" }} />
              <span>Parent Portal Login</span>
            </Link>
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginTop: "8px",
                paddingLeft: "16px",
              }}
            >
              Access fees, attendance, and reports
            </p>
          </div>

          {/* Contact Info */}
          <div
            style={{
              backgroundColor: colors.card,
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: colors.text,
                marginBottom: "12px",
              }}
            >
              Get in Touch
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "14px",
              }}
            >
              <a
                href="mailto:alhikmahinstitutecrawley@gmail.com"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  color: colors.textMuted,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#22c55e")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = colors.textMuted)
                }
              >
                <Mail
                  style={{
                    width: "16px",
                    height: "16px",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ wordBreak: "break-all" }}>
                  alhikmahinstitutecrawley@gmail.com
                </span>
              </a>

              <a
                //   href="tel:+447411061242"
                //   style={{
                //     display: "flex",
                //     alignItems: "center",
                //     gap: "8px",
                //     color: colors.textMuted,
                //     textDecoration: "none",
                //     transition: "color 0.2s",
                //   }}
                //   onMouseEnter={(e) => (e.currentTarget.style.color = "#22c55e")}
                //   onMouseLeave={(e) =>
                //     (e.currentTarget.style.color = colors.textMuted)
                //   }
                // >
                //   <Phone
                //     style={{ width: "16px", height: "16px", flexShrink: 0 }}
                //   />
                //   <span>+44 7411 061242</span>
                // </a>
                href="https://wa.me/447411061242?text=Hello%20Al%20Hikmah%20Institute%20Crawley"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: colors.textMuted,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#25D366")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = colors.textMuted)
                }
              >
                <svg
                  style={{ width: "16px", height: "16px", flexShrink: 0 }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>WhatsApp: +44 7411 061242</span>
              </a>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  color: colors.textMuted,
                }}
              >
                <svg
                  style={{
                    width: "16px",
                    height: "16px",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Crawley, West Sussex, UK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Hamburger/Close Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        style={{ position: "relative", zIndex: 10000 }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Render menu in portal at body level (outside header hierarchy) */}
      {mounted && menuContent && createPortal(menuContent, document.body)}
    </>
  );
}
