
// app/layout.tsx
import "./globals.css";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import Link from "next/link";



export const metadata: Metadata = {
  title: "COACHD",
  description: "Your coaching. Elevated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ===== HEADER ===== */}
        <header className="absolute top-0 left-0 z-50 w-full border-b border-white/10 bg-transparent">

  <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
    {/* Logo */}
    <Link href="/" className="flex items-center">
      <img
        src="/logo.png"
        alt="COACHD logo"
        className="h-10 w-auto object-contain"
      />
    </Link>

    {/* Nav */}
    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-white">
      <Link href="/" className="hover:text-blue-400 transition">HOME</Link>
      <span className="text-blue-500">|</span>
      <Link href="/features" className="hover:text-blue-400 transition">FEATURES</Link>
      <span className="text-blue-500">|</span>
      <Link href="/pricing" className="hover:text-blue-400 transition">PRICING</Link>
      <span className="text-blue-500">|</span>
      <Link href="/dashboard" className="hover:text-blue-400 transition">DASHBOARD</Link>
      <span className="text-blue-500">|</span>
      <Link href="/support" className="hover:text-blue-400 transition">SUPPORT</Link>
    </nav>

    {/* Auth Buttons */}
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-400 transition shadow-md"
      >
        LOGIN
      </Link>
      <Link
        href="/signup"
        className="px-4 py-2 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition"
      >
        SIGN UP
      </Link>
    </div>
  </div>
</header>


        {/* ===== PAGE CONTENT ===== */}
        <main>{children}</main>

        {/* Toasts */}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
