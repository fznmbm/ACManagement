// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Attendance & Curriculum System",
  description:
    "Comprehensive attendance and management system for Islamic educational centres",
  keywords: [
    "madrasa",
    "attendance",
    "islamic education",
    "student management",
  ],
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
      </body>
    </html>
  );
}
