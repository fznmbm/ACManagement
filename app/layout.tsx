// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Madrasa Attendance System",
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
      {/* <body className={inter.className}>{children}</body> */}
      <body suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="madrasa-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
