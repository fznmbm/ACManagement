// lib/utils/domains.ts

/**
 * Get domain URLs based on environment
 * Returns different URLs for testing (Vercel) vs production (custom domains)
 */
export const getDomainUrls = () => {
  // Check if we're using production custom domains
  const useCustomDomains =
    process.env.NEXT_PUBLIC_USE_CUSTOM_DOMAINS === "true";

  if (useCustomDomains) {
    // Production: Custom domains
    return {
      public: "https://al-hikmah.org",
      admin: "https://admin.al-hikmah.org",
      parent: "https://parent.al-hikmah.org",
    };
  } else {
    // Testing: Vercel domains
    return {
      public: "https://ahic.vercel.app",
      admin: "https://ahic-admin.vercel.app",
      parent: "https://ahic-parent.vercel.app",
    };
  }
};

/**
 * Get current domain type based on hostname
 */
export const getCurrentDomainType = (
  hostname: string
): "admin" | "parent" | "public" => {
  if (hostname.includes("admin")) return "admin";
  if (hostname.includes("parent")) return "parent";
  return "public";
};

/**
 * Check if we're on a specific domain
 */
export const isAdminDomain = (hostname: string) => hostname.includes("admin");
export const isParentDomain = (hostname: string) => hostname.includes("parent");
export const isPublicDomain = (hostname: string) =>
  !hostname.includes("admin") && !hostname.includes("parent");
