"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type AthleteRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  program_id?: string | null;
  program_start_date?: string | null;
  program_end_date?: string | null;
  programs?: { data: any };
};

type ProgramRow = { id: string; name: string };

function fullName(a: AthleteRow) {
  return `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || "Unnamed";
}

function startOfWeek(d: Date) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - s.getDay());
  return s;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CoachDashboard() {
  const [query, setQuery] = useState("");
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [rangeStart, setRangeStart] = useState<Date>(startOfWeek(new Date()));

  const [showProgramsModal, setShowProgramsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("athletes")
        .select(
          "id, first_name, last_name, avatar_url, program_id, program_start_date, program_end_date"
        )
        .eq("coach_id", user.id);
      setAthletes(data ?? []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("programs").select("id,name");
      setPrograms((data as ProgramRow[]) ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return athletes.filter((a) => fullName(a).toLowerCase().includes(q));
  }, [query, athletes]);

  const days = Array.from({ length: 35 }, (_, i) => addDays(rangeStart, i));
  const today = new Date();

  function athletesOn(date: Date) {
    return athletes.filter((a) => {
      if (!a.programs?.data) return false;
      const startDate = a.program_start_date
        ? new Date(a.program_start_date)
        : null;
      const endDate = a.program_end_date
        ? new Date(a.program_end_date)
        : null;
      if (!startDate || date < startDate) return false;
      if (endDate && date > endDate) return false;
      const daysSinceStart = Math.floor(
        (date.getTime() - startDate.getTime()) / 86400000
      );
      const weekIndex = Math.floor(daysSinceStart / 7);
      const dayIndex = daysSinceStart % 7;
      const weeks = a.programs?.data?.weeks || [];
      const week = weeks[weekIndex];
      if (!week) return false;
      return week.days?.[dayIndex]?.length > 0;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white">
      <header className="w-full">
        <div className="pl-10 h-16 flex items-center">
          <h1 className="text-2xl font-bold text-white relative inline-block">
            Coach Dashboard
            <span className="absolute left-0 -bottom-1 w-[120%] h-[2px] bg-blue-500"></span>
          </h1>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT COLUMN */}
          <aside className="w-full lg:w-1/4 space-y-4 relative">
            {/* Athletes Link */}
            <div className="flex justify-center">
              <Link
                href="/dashboard/athletes"
                className="relative pb-1 text-lg font-medium text-slate-300 hover:text-white transition-colors group"
              >
                Athletes
                <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search athletes"
                className="w-full rounded-xl border bg-white/5 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-blue-400"
              />
            </div>

            {/* Invite Athlete */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full inline-flex items-center gap-2 rounded-xl bg-orange-600 text-white px-3 py-2 text-sm hover:bg-orange-500"
            >
              <Plus size={16} /> Invite Athlete
            </button>

            {/* Create Program */}
            <Link
              href="/dashboard/programs"
              className="w-full inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500"
            >
              <Plus size={16} /> Create Program
            </Link>
          </aside>

          {/* RIGHT COLUMN */}
          <section className="flex-1 space-y-4 relative">
            {/* Programs + Sessions Buttons */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowProgramsModal(true)}
                className="relative pb-1 text-lg font-medium text-slate-300 hover:text-white transition-colors group"
              >
                Programs
                <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={() => setShowSessionsModal(true)}
                className="relative pb-1 text-lg font-medium text-slate-300 hover:text-white transition-colors group"
              >
                Sessions
                <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>

            {/* ===== CALENDAR ===== */}
            <section className="rounded-lg border border-slate-800 bg-slate-950 shadow-lg p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-wide text-white">
                  {rangeStart.toLocaleDateString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRangeStart(addDays(rangeStart, -35))}
                    className="p-2 rounded hover:bg-slate-800"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setRangeStart(addDays(rangeStart, 35))}
                    className="p-2 rounded hover:bg-slate-800"
                  >
                    <ChevronRightIcon size={18} />
                  </button>
                </div>
              </div>

              {/* Day headers - left aligned */}
              <div className="grid grid-cols-7 text-left text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="pl-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px bg-slate-800 rounded overflow-hidden">
                {days.map((date, i) => {
                  const isToday = sameDay(date, today);
                  const scheduled = athletesOn(date);

                  return (
                    <div
                      key={i}
                      className={`min-h-[90px] p-2 text-xs border border-slate-800 flex flex-col hover:bg-slate-800/70 transition ${
                        isToday
                          ? "bg-slate-900/80 border-blue-500"
                          : "bg-slate-950"
                      }`}
                    >
                      <div className="text-slate-500 text-xs font-medium mb-1">
                        {date.getDate()}
                      </div>
                      <div className="flex flex-col gap-1">
                        {scheduled.length > 0 ? (
                          scheduled.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-1 text-slate-200 text-xs truncate"
                            >
                              <img
                                src={a.avatar_url || "/default-avatar.png"}
                                alt={fullName(a)}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              {fullName(a)}
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-700">–</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
