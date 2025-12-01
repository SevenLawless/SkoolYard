import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SchoolYard",
  description: "School management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased app-bg`}>
        <AuthProvider>
          <DataProvider>
            <Sidebar />
            <main className="min-h-screen p-6 lg:p-8 pt-16 lg:pt-6 transition-all duration-300">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
            <Toaster position="top-right" />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
