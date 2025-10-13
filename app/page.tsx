// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BarChart3, Users, Dumbbell } from "lucide-react";

export default function HomePage() {
  const [session, setSession] = useState<any | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-slate-900 to-black text-white uppercase">
      {/* ===== HERO ===== */}
      <header className="relative h-screen flex flex-col items-center justify-center px-6 text-center">
        <img
          src="/coach-hero.jpg"
          alt="hero background"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold">
            YOUR COACHING. ELEVATED.
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
            BUILD, ASSIGN, AND TRACK TRAINING PROGRAMS IN MINUTES. A PLATFORM
            FOR MODERN FITNESS COACHES AND THEIR ATHLETES.
          </p>

          <div className="mt-8 flex gap-4 justify-center">
            {!session ? (
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg"
              >
                COACH LOGIN
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg"
              >
                GO TO DASHBOARD
              </Link>
            )}

            {/* Updated signup link */}
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </header>

      {/* ===== FEATURES ===== */}
      <section className="py-16 bg-white/5 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 grid gap-10 md:grid-cols-3">
          <FeatureCard
            icon={<BarChart3 size={28} />}
            title="COACH DASHBOARD"
            text="TRACK ATHLETES, ASSIGN PROGRAMS, AND VIEW PERFORMANCE AT A GLANCE."
          />
          <FeatureCard
            icon={<Users size={28} />}
            title="ATHLETE APP"
            text="ATHLETES GET A CLEAN, MOBILE-FIRST APP TO VIEW WORKOUTS AND LOG PROGRESS."
          />
          <FeatureCard
            icon={<Dumbbell size={28} />}
            title="PROGRAM BUILDER"
            text="EASILY CREATE, CUSTOMIZE, AND ASSIGN STRUCTURED TRAINING PLANS."
          />
        </div>
      </section>

      {/* ===== CTA STRIP ===== */}
      <section className="py-20 text-center bg-gradient-to-r from-blue-600 to-orange-600">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          READY TO ELEVATE YOUR COACHING?
        </h2>
        <p className="text-lg text-white/90 mb-8">
          START BUILDING PROGRAMS TODAY. FREE TRIAL INCLUDED.
        </p>
        {/* Updated CTA button */}
        <Link
          href="/signup"
          className="px-8 py-4 rounded-xl bg-black/70 hover:bg-black/90 text-white font-bold shadow-lg"
        >
          GET STARTED FREE
        </Link>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} COACHD.COM. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-md hover:shadow-lg transition">
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}
