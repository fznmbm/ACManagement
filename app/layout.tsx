// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Al Hikmah Institute Crawley",
    template: "%s · Al Hikmah Institute Crawley",
  },
  description:
    "Al Hikmah Institute Crawley — student portal for parents and staff",
  keywords: [
    "madrasa",
    "attendance",
    "islamic education",
    "student management",
  ],
  applicationName: "Al Hikmah",
  appleWebApp: {
    capable: true,
    title: "Al Hikmah",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 🔥 CRITICAL FIX: Apply theme BEFORE React renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storageKey = 'madrasa-theme';
                  const theme = localStorage.getItem(storageKey) || 'system';
                  
                  let effectiveTheme = theme;
                  if (theme === 'system') {
                    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  const root = document.documentElement;
                  const body = document.body;
                  
                  // Apply theme immediately
                  root.classList.remove('light', 'dark');
                  body.classList.remove('light', 'dark');
                  root.classList.add(effectiveTheme);
                  body.classList.add(effectiveTheme);
                  root.style.setProperty('--theme', effectiveTheme);
                  
                  // Set color scheme
                  root.style.colorScheme = effectiveTheme;
                } catch (e) {
                  // Fallback to dark mode on error
                  document.documentElement.classList.add('dark');
                  document.body.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="madrasa-theme">
          {children}
        </ThemeProvider>
        {/* Register the service worker so the app is installable on Android */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
