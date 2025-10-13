// app/dashboard/programs/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Dumbbell,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

/** Types */
type Exercise = { id: string; name: string; group: string; video?: string };
type WorkoutSet = { id: string; percent?: string; weight?: string; reps: number; rest?: string };
type Workout = { id: string; exercise: string; sets: WorkoutSet[]; tempo?: string; notes?: string };
type DayPlan = Workout[];
type WeekPlan = { id: number; days: Record<number, DayPlan> };
type ProgramRow = { id: string; coach_id: string; name: string; data: { weeks: WeekPlan[] } };

/** Helpers */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const uid = () => Math.random().toString(36).slice(2, 9);

export default function ProgramsPage() {
  const router = useRouter();

  /** Program state */
  const [programId, setProgramId] = useState<string | null>(null);
  const [programName, setProgramName] = useState("New Program");
  const [saving, setSaving] = useState(false);

  /** Exercise Library */
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: "ex1", name: "Bench Press", group: "Chest" },
    { id: "ex2", name: "Back Squat", group: "Quads" },
    { id: "ex3", name: "Pull-Ups", group: "Back" },
    { id: "ex4", name: "RDL", group: "Hamstrings" },
    { id: "ex5", name: "Overhead Press", group: "Shoulders" },
  ]);
  const [newExName, setNewExName] = useState("");
  const [newExGroup, setNewExGroup] = useState("");

  function addExercise() {
    if (!newExName.trim()) return;
    setExercises((prev) => [
      { id: uid(), name: newExName.trim(), group: newExGroup.trim() || "General" },
      ...prev,
    ]);
    setNewExName("");
    setNewExGroup("");
    toast.success("Exercise added");
  }

  /** Program structure */
  const emptyWeek = (id: number): WeekPlan => ({
    id,
    days: Object.fromEntries(DAYS.map((_, i) => [i, []] as [number, DayPlan])) as Record<
      number,
      DayPlan
    >,
  });
  const [weeks, setWeeks] = useState<WeekPlan[]>([emptyWeek(0)]);
  const [active, setActive] = useState<{ week: number; day: number }>({ week: 0, day: 0 });

  function addWeek() {
    const nextId = weeks.length;
    setWeeks((prev) => [...prev, emptyWeek(nextId)]);
    setActive({ week: nextId, day: 0 });
    toast.success(`Week ${nextId + 1} added`);
  }

  function duplicateWeek(weekId: number) {
    const weekToCopy = weeks.find((w) => w.id === weekId);
    if (!weekToCopy) return;
    const cloned: WeekPlan = {
      id: weeks.length,
      days: Object.fromEntries(
        Object.entries(weekToCopy.days).map(([dayIdx, workouts]) => [
          Number(dayIdx),
          workouts.map((w) => ({
            ...w,
            id: uid(),
            sets: w.sets.map((s) => ({ ...s, id: uid() })),
          })),
        ])
      ),
    };
    setWeeks((prev) => [...prev, cloned]);
    setActive({ week: cloned.id, day: 0 });
    toast.success(`Duplicated Week ${weekId + 1}`);
  }

  function clearDay(weekId: number, dayIdx: number) {
    if (!confirm(`Clear all items for ${DAYS[dayIdx]} (Week ${weekId + 1})?`)) return;
    setWeeks((prev) =>
      prev.map((w) => (w.id === weekId ? { ...w, days: { ...w.days, [dayIdx]: [] } } : w))
    );
    toast.success("Day cleared");
  }

  /** Editor */
  const [editor, setEditor] = useState<Workout | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  function loadExerciseToEditor(ex: Exercise) {
    setSelectedExerciseId(ex.id);
    setEditor({
      id: uid(),
      exercise: ex.name,
      sets: [
        { id: uid(), reps: 10 },
        { id: uid(), reps: 10 },
        { id: uid(), reps: 10 },
      ],
    });
  }

  function updateSet(i: number, field: keyof WorkoutSet, value: string) {
    if (!editor) return;
    const sets = editor.sets.map((s, idx) =>
      idx === i ? { ...s, [field]: field === "reps" ? Number(value) || 0 : value } : s
    );
    setEditor({ ...editor, sets });
  }

  function addSetRow() {
    if (!editor) return;
    setEditor({ ...editor, sets: [...editor.sets, { id: uid(), reps: 10 }] });
  }

  function addToPlan() {
    if (!editor) return toast.error("Select or build an exercise first.");
    setWeeks((prev) =>
      prev.map((w) =>
        w.id === active.week
          ? { ...w, days: { ...w.days, [active.day]: [...w.days[active.day], editor] } }
          : w
      )
    );
    setEditor(null);
    setSelectedExerciseId("");
    toast.success("Exercise added to plan");
  }

  function removeWorkout(weekId: number, dayIdx: number, rowId: string) {
    setWeeks((prev) =>
      prev.map((w) =>
        w.id === weekId
          ? { ...w, days: { ...w.days, [dayIdx]: w.days[dayIdx].filter((r) => r.id !== rowId) } }
          : w
      )
    );
    toast.success("Exercise removed");
  }

  /** Program save/update */
  const [library, setLibrary] = useState<ProgramRow[]>([]);

  function hasAnyItems(pWeeks: WeekPlan[]) {
    return pWeeks.some((wk) => Object.values(wk.days).some((d) => d.length > 0));
  }

  async function saveProgramToLibrary() {
    if (!programName.trim()) return toast.error("Name required");
    if (!hasAnyItems(weeks)) return toast.error("Add workouts first");

    const duplicate = library.find(
      (p) => p.name.trim().toLowerCase() === programName.trim().toLowerCase() && p.id !== programId
    );
    if (duplicate) {
      toast.error("Program name already exists. Choose another.");
      return;
    }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const coachId = auth.user?.id;
      if (!coachId) throw new Error("Not logged in");

      const payload = { coach_id: coachId, name: programName.trim(), data: { weeks } };

      if (programId) {
        const { error } = await supabase.from("programs").update(payload).eq("id", programId);
        if (error) throw error;
        toast.success("Program updated");
      } else {
        const { data, error } = await supabase.from("programs").insert(payload).select().single();
        if (error) throw error;
        setProgramId(data.id);
        toast.success("Program saved");
      }
      fetchLibrary();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /** Program library */
  async function fetchLibrary() {
    const { data: auth } = await supabase.auth.getUser();
    const coachId = auth.user?.id;
    if (!coachId) return;
    const { data, error } = await supabase
      .from("programs")
      .select("id, name, data")
      .eq("coach_id", coachId);
    if (!error && data) setLibrary(data as ProgramRow[]);
  }

  async function loadProgram(id: string) {
    if (id === programId) {
      setProgramId(null);
      setProgramName("New Program");
      setWeeks([emptyWeek(0)]);
      toast.success("Cleared program");
      return;
    }
    const { data, error } = await supabase.from("programs").select("*").eq("id", id).single();
    if (error) return toast.error(error.message);
    setProgramId(data.id);
    setProgramName(data.name);
    setWeeks(data.data.weeks);
    toast.success(`Loaded ${data.name}`);
  }

  useEffect(() => {
    fetchLibrary();
  }, []);

  /** ================= JSX ================= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white p-6">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <input
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="Program name"
            className="w-64 rounded-lg border border-white/15 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30"
          />
          <button
            onClick={saveProgramToLibrary}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm hover:bg-orange-500 transition disabled:opacity-60"
          >
            {saving ? "Saving…" : (<><Save size={16} /> {programId ? "Update" : "Save"}</>)}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[250px,1fr] gap-6">
        {/* Program Library Sidebar */}
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Your Programs</h2>
          {library.length === 0 ? (
            <p className="text-sm text-slate-400">No programs saved.</p>
          ) : (
            <div className="max-h-24 overflow-y-auto pr-1">
              <ul className="space-y-2">
                {library.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => loadProgram(p.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        p.id === programId
                          ? "bg-orange-600 text-white"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main Builder Area */}
        <main className="space-y-6">
          {/* Title + Week nav */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Dumbbell size={22} className="text-orange-400" />
              Program Builder
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActive((prev) => ({ week: Math.max(0, prev.week - 1), day: 0 }))}
                className="rounded-lg border border-white/15 p-1 hover:bg-white/10"
              >
                <ChevronLeft />
              </button>
              <span className="font-semibold">Week {active.week + 1}</span>
              <button
                onClick={() =>
                  setActive((prev) => ({ week: Math.min(weeks.length - 1, prev.week + 1), day: 0 }))
                }
                className="rounded-lg border border-white/15 p-1 hover:bg-white/10"
              >
                <ChevronRight />
              </button>
              <button
                onClick={addWeek}
                className="ml-2 rounded-lg bg-orange-600 text-white px-3 py-1.5 text-sm hover:bg-orange-500"
              >
                <Plus size={16} /> Add Week
              </button>
            </div>
          </div>

          {/* Exercise Library + Editor */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Exercise Library */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <h2 className="font-semibold mb-3">Exercise Library</h2>
              <div className="flex gap-2 mb-3">
                <input
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  placeholder="Name"
                  className="w-28 rounded-lg border border-white/15 bg-white/5 text-white px-2 py-1.5 text-sm"
                />
                <input
                  value={newExGroup}
                  onChange={(e) => setNewExGroup(e.target.value)}
                  placeholder="Group"
                  className="w-20 rounded-lg border border-white/15 bg-white/5 text-white px-2 py-1.5 text-sm"
                />
                <button
                  onClick={addExercise}
                  className="rounded-lg bg-orange-600 text-white px-3 py-1.5 text-sm hover:bg-orange-500"
                >
                  Add
                </button>
              </div>
              <ul className="divide-y divide-white/10">
                {exercises.map((ex) => (
                  <li key={ex.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{ex.name}</p>
                      <p className="text-xs text-slate-400">{ex.group}</p>
                    </div>
                    <button
                      onClick={() => loadExerciseToEditor(ex)}
                      className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Editor */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <h2 className="font-semibold mb-3">
                Editor <span className="text-slate-400">(Week {active.week + 1}, {DAYS[active.day]})</span>
              </h2>
              {editor ? (
                <div className="space-y-4">
                  <p className="font-medium">{editor.exercise}</p>
                  <table className="w-full text-sm rounded-lg overflow-hidden border border-white/10">
                    <thead className="bg-white/5 text-slate-300 text-[11px] uppercase tracking-wide">
                      <tr>
                        <th className="px-2 py-1 text-left">Set</th>
                        <th className="px-2 py-1 text-left">%1RM</th>
                        <th className="px-2 py-1 text-left">Weight</th>
                        <th className="px-2 py-1 text-left">Reps</th>
                        <th className="px-2 py-1 text-left">Rest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editor.sets.map((set, i) => (
                        <tr key={set.id} className="border-t border-white/10">
                          <td className="px-2 py-1">{i + 1}</td>
                          <td className="px-2 py-1">
                            <input
                              value={set.percent || ""}
                              onChange={(e) => updateSet(i, "percent", e.target.value)}
                              className="w-full rounded-md border border-white/15 bg-white/5 text-white px-2 py-1"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              value={set.weight || ""}
                              onChange={(e) => updateSet(i, "weight", e.target.value)}
                              className="w-full rounded-md border border-white/15 bg-white/5 text-white px-2 py-1"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSet(i, "reps", e.target.value)}
                              className="w-full rounded-md border border-white/15 bg-white/5 text-white px-2 py-1"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              value={set.rest || ""}
                              onChange={(e) => updateSet(i, "rest", e.target.value)}
                              className="w-full rounded-md border border-white/15 bg-white/5 text-white px-2 py-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={addSetRow}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-sm text-slate-200 hover:bg-white/10"
                    >
                      + Add Set
                    </button>
                    <button
                      onClick={addToPlan}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-1.5 hover:bg-orange-500"
                    >
                      <Plus size={16} /> Add to Plan
                    </button>
                  </div>
                  <textarea
                    value={editor.notes || ""}
                    onChange={(e) => setEditor({ ...editor, notes: e.target.value })}
                    placeholder="Notes"
                    className="w-full rounded-md border border-white/15 bg-white/5 text-white px-3 py-2 text-sm"
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400">Select an exercise to start.</p>
              )}
            </section>
          </div>

          {/* Weeks grid */}
          <section className="space-y-6">
            {weeks.map((week) => (
              <div key={week.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Week {week.id + 1}</h3>
                  <button
                    onClick={() => duplicateWeek(week.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-orange-600 text-white px-3 py-1 text-xs hover:bg-orange-500"
                  >
                    <Copy size={14} /> Duplicate Week
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {DAYS.map((label, idx) => {
                    const dayPlan = week.days[idx] ?? [];
                    const isActive = active.week === week.id && active.day === idx;
                    return (
                      <div
                        key={label}
                        onClick={() => setActive({ week: week.id, day: idx })}
                        className={`cursor-pointer rounded-xl border p-3 transition ${
                          isActive ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{label}</div>
                          <div className="text-xs text-slate-400">
                            {dayPlan.length} item{dayPlan.length === 1 ? "" : "s"}
                          </div>
                        </div>
                        {dayPlan.length === 0 ? (
                          <p className="text-xs text-slate-500">No workouts yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {dayPlan.map((row) => (
                              <li
                                key={row.id}
                                className="flex items-start justify-between rounded-lg bg-white text-slate-900 px-3 py-2 shadow-sm"
                              >
                                <div
                                  className="min-w-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editWorkout(row, week.id, idx);
                                  }}
                                >
                                  <div className="font-semibold truncate">{row.exercise}</div>
                                  <div className="text-xs text-slate-600">
                                    {row.sets.length} sets • {row.sets.map((s) => `${s.reps} reps`).join(", ")}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeWorkout(week.id, idx, row.id);
                                  }}
                                  className="text-slate-400 hover:text-red-500 self-center"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearDay(week.id, idx);
                            }}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 text-red-300/90"
                          >
                            Clear Day
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
