"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Search, Pencil } from "lucide-react";
import jsPDF from "jspdf";
import { exportWorkoutsAsText } from "@/utils/exportUtils";

type ProgramData = {
  weeks: { days: any[][] }[];
};

type AthleteRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  program_id?: string | null;
  program_start_date?: string | null;
  program_end_date?: string | null;
  group?: string | null;
  programs?: { name: string; data: ProgramData } | null;
};

function fullName(a: AthleteRow) {
  return `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || "Unnamed";
}

function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
const [coachName, setCoachName] = useState("");

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteRow | null>(null);
  const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, any[]>>({});
  const [exercises, setExercises] = useState<any[]>([]);

// === EXPORT HELPERS ===
function exportText() {
  if (!selectedAthlete) {
    alert("Select an athlete first.");
    return;
  }

  const name = fullName(selectedAthlete);
  const lines: string[] = [];
  lines.push(`Athlete: ${name}`);
  lines.push("");

  Object.entries(workoutsByDate).forEach(([date, workouts]) => {
    lines.push(`${date}`);
    (workouts as any[]).forEach((w: any) => {
      const s = w.sets?.[0] || {};
      lines.push(`  • ${w.name} (${s.sets || ""}x${s.reps || ""} ${s.weight || s.percent || ""})`);
    });
    lines.push("");
  });

  navigator.clipboard.writeText(lines.join("\n"));
  alert("Workout plan copied to clipboard.");
}

function exportPDF() {
  if (!selectedAthlete) {
    alert("Select an athlete first.");
    return;
  }


const [coachName, setCoachName] = useState("");

  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(14);
  doc.text(`Athlete: ${fullName(selectedAthlete)}`, 10, y);
  y += 10;

  doc.setFontSize(11);
  Object.entries(workoutsByDate).forEach(([date, workouts]) => {
    doc.text(date, 10, y);
    y += 6;
    (workouts as any[]).forEach((w: any) => {
      const s = w.sets?.[0] || {};
      const line = `${w.name} (${s.sets || ""}x${s.reps || ""} ${s.weight || s.percent || ""})`;
      doc.text(line, 14, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    y += 4;
  });

  doc.save(`${fullName(selectedAthlete)}_workouts.pdf`);
}



  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirst, setInviteFirst] = useState("");
  const [inviteLast, setInviteLast] = useState("");

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
 useEffect(() => {
    loadAthletes();
    loadExercises();
  }, []);


 async function loadAthletes() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setLoading(false);
    return;
  }

  const nameFromUser =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Coach";

  setCoachName(nameFromUser);
  console.log("Coach name loaded:", nameFromUser);

  const { data, error } = await supabase
    .from("athletes")
    .select(`
      id, first_name, last_name, avatar_url,
      program_id, program_start_date, program_end_date, program_data, group,
      programs ( name )
    `)
    .eq("coach_id", user.id);

  if (error) console.error("Supabase error:", JSON.stringify(error));
  setAthletes(data ?? []);
  setLoading(false);
}  // ✅ <— this brace closes loadAthletes



async function loadAthleteWorkouts(athleteId: string) {
  const { data, error } = await supabase
    .from("athlete_workouts")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("date", { ascending: true })
    .order("id", { ascending: true }); // 🧩 ensures stable order for workouts on same day

  if (error) {
    console.error("Error loading athlete workouts:", error);
    return;
  }

  const grouped: Record<string, any[]> = {};
  data.forEach((w) => {
    if (!grouped[w.date]) grouped[w.date] = [];
    grouped[w.date].push(w);
  });

  setWorkoutsByDate(grouped);
}


  async function handleUpdateSet(workout: any, setIndex: number, field: string, value: any) {
  try {
    // 1️⃣ Copy and initialize sets if missing
    const updatedSets = Array.isArray(workout.sets)
      ? [...workout.sets]
      : [{ sets: "", reps: "", weight: "", percent: "" }];

    // 2️⃣ Update target field
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };

    // 3️⃣ Update DB (JSON directly)
    const { error } = await supabase
      .from("athlete_workouts")
      .update({ sets: updatedSets })
      .eq("id", workout.id);

    if (error) throw error;

    // 4️⃣ Optimistically update UI without reload
    setWorkoutsByDate((prev) => {
      const dayKey = workout.date;
      const updated = { ...(prev[dayKey] || []) };
      const newArr = prev[dayKey].map((w) =>
        w.id === workout.id ? { ...w, sets: updatedSets } : w
      );
      return { ...prev, [dayKey]: newArr };
    });
  } catch (err) {
    console.error("Error updating set:", err);
  }
}


  async function loadExercises() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return console.error("No user found:", userError);

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .or(`coach_id.eq.${user.id},coach_id.is.null`);

    if (error) console.error("Error loading exercises:", error);
    else setExercises(data);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = athletes.filter((a) => fullName(a).toLowerCase().includes(q));
    if (filter === "Active") list = list.filter((a) => a.program_id);
    else if (filter === "Inactive") list = list.filter((a) => !a.program_id);
    else if (filter === "Archived") list = [];
    return list;
  }, [query, filter, athletes]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const totalCells = 42;


const [newExercise, setNewExercise] = useState({ name: "", muscle_group: "" });
const [addingExercise, setAddingExercise] = useState(false);



  type Cell = { date: Date; inMonth: boolean; day: number };
  const cells: Cell[] = Array.from({ length: totalCells }, (_, i) => {
    const prevDays = firstDow;
    const dayNum = i - prevDays + 1;
    if (i < prevDays) {
      const d = daysInPrevMonth - (prevDays - i) + 1;
      return { date: new Date(viewYear, viewMonth - 1, d), inMonth: false, day: d };
    }
    if (dayNum > 0 && dayNum <= daysInMonth)
      return { date: new Date(viewYear, viewMonth, dayNum), inMonth: true, day: dayNum };
    const nextDay = dayNum - daysInMonth;
    return { date: new Date(viewYear, viewMonth + 1, nextDay), inMonth: false, day: nextDay };
  });

  const today = atMidnight(new Date());

  if (loading) return <div className="p-6 text-white">Loading athletes...</div>;

  return (
    <main className="p-6 text-white w-full">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 hover:border-blue-500 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 relative inline-block">
        Athletes
        <span className="absolute left-0 -bottom-1 w-[130%] h-[2px] bg-orange-500"></span>
      </h1>

      {/* Filters */}
      <div className="flex gap-6 mb-6 text-sm font-medium">
        {[
          { label: "All", count: athletes.length },
          { label: "Active", count: athletes.filter((a) => a.program_id).length },
          { label: "Inactive", count: athletes.filter((a) => !a.program_id).length },
          { label: "Archived", count: 0 },
        ].map((status) => (
          <button
            key={status.label}
            onClick={() => setFilter(status.label)}
            className={`relative pb-1 transition group ${
              filter === status.label ? "text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {status.label} ({status.count})
            {filter === status.label && (
              <span className="absolute left-0 -bottom-1 h-[2px] w-full bg-blue-500"></span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search athletes"
            className="w-full rounded-lg border bg-slate-900 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-blue-400"
          />
        </div>
      </div>

      {/* Athletes Row */}
      <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar no-select">
        {[{ id: "invite-dummy" } as any, ...filtered].map((a) =>
          a.id === "invite-dummy" ? (
            <div key="invite" className="flex-shrink-0 w-44">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex flex-col items-center justify-between w-full h-44 p-4 rounded-lg border border-blue-600 hover:border-blue-400 transition"
              >
                <div className="relative w-20 h-20 mb-2">
                  <div className="w-20 h-20 rounded-full border-4 border-orange-100 flex items-center justify-center animate-pulse">
                    <span className="text-orange-500 font-bold text-2xl">+</span>
                  </div>
                </div>
                <div className="text-lg font-semibold text-center">Invite Athlete</div>
              </button>
            </div>
          ) : (
            <div key={a.id} className="flex-shrink-0 w-44">
              <div
                onClick={() => {
                  setSelectedAthlete(a);
                  loadAthleteWorkouts(a.id);
                }}
                className="relative flex flex-col items-center justify-between w-full h-44 p-4 rounded-lg border border-blue-600 hover:border-blue-400 transition cursor-pointer"
              >
                <Link
                  href={`/dashboard/athletes/${a.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 p-1 bg-slate-800 rounded hover:bg-blue-600"
                >
                  <Pencil size={14} className="text-white" />
                </Link>

                <div className="relative w-20 h-20 mb-2">
                  <img
                    src={a.avatar_url || "/default-avatar.png"}
                    alt={fullName(a)}
                    className="w-20 h-20 rounded-full object-cover border-4 border-orange-100"
                  />
                </div>
                <div className="text-lg font-semibold text-center">{fullName(a)}</div>
                {a.programs?.name && (
                  <div className="text-xs text-slate-400">{a.programs.name}</div>
                )}
                {a.group && <div className="text-xs text-orange-400">{a.group}</div>}
              </div>
            </div>
          )
        )}
      </div>

     {/* Exercise Library + Calendar */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">

  {/* Exercise Library */}
  <section className="lg:col-span-1 rounded-lg border border-slate-800 bg-slate-950 shadow-lg p-4">
    <h2 className="text-lg font-semibold mb-4 text-white">Exercise Library</h2>

    {/* Add New Exercise */}
    <div className="flex items-center gap-2 mb-4 sticky top-0 bg-slate-950 pb-2 z-10 border-b border-slate-800">
      <div className="flex flex-col gap-1 flex-1">
        <input
          type="text"
          value={newExercise.name}
          onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
          placeholder="Exercise name..."
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white placeholder-slate-500"
        />
        <input
          type="text"
          value={newExercise.muscle_group}
          onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
          placeholder="Muscle group..."
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white placeholder-slate-500"
        />
      </div>

      <button
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { error } = await supabase.from("exercises").insert([{
            coach_id: user.id,
            name: newExercise.name.trim(),
            muscle_group: newExercise.muscle_group.trim(),
          }]);
          if (error) console.error("Error adding exercise:", error);
          else await loadExercises();
          setNewExercise({ name: "", muscle_group: "" });
        }}
        className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-md flex items-center justify-center text-white text-lg font-bold"
      >
        +
      </button>
    </div>

    {/* Exercise List */}
    <ul className="divide-y divide-slate-800 text-sm max-h-[60vh] overflow-y-auto">
      {exercises.map((ex) => (
        <li
          key={ex.id}
          draggable={true}
          onDragStart={(e) => {
  e.dataTransfer.effectAllowed = "copyMove";
  e.dataTransfer.setData("application/json", JSON.stringify(ex));
}}
  className="py-2 flex items-center justify-between cursor-grab hover:bg-slate-800/50 px-2 rounded"
>
          <div>
            <p className="font-medium text-white">{ex.name}</p>
            <p className="text-xs text-slate-400">{ex.muscle_group}</p>
          </div>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const { error } = await supabase.from("exercises").delete().eq("id", ex.id);
              if (error) console.error(error);
              else await loadExercises();
            }}
            className="ml-2 w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white transition"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  </section>

  {/* Calendar */}
  <section className="lg:col-span-4 rounded-lg border border-slate-800 bg-slate-950 shadow-lg p-6">
    {/* Month Header */}
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="text-slate-400 hover:text-white">
        ←
      </button>
      <h2 className="text-xl font-semibold text-white">{monthName} {viewYear}</h2>
      <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="text-slate-900 hover:text-white">
        →
      </button>
    </div>

    {/* Day Headers */}
    <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-100 border-b border-slate-800 pb-2 mb-2">
      {["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((d) => (
        <div key={d}>{d}</div>
      ))}
    </div>

{/* Month Grid */}
  <div className="grid grid-cols-7 gap-[1px] bg-slate-800 text-xs">
    {cells.map((c, idx) => {
      const dayKey = c.date.toISOString().split("T")[0];
      const dayWorkouts = workoutsByDate?.[dayKey] || [];
      const isToday =
        atMidnight(c.date).getTime() === atMidnight(new Date()).getTime();

      return (
        <div
          key={idx}
          onDragOver={(e) => {
            e.preventDefault(); // ✅ Required to allow drop
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={async (e) => {
            e.preventDefault();
            const ex = JSON.parse(e.dataTransfer.getData("application/json"));
            if (!selectedAthlete) {
              alert("Please select an athlete first!");
              return;
            }

            const dayKey = c.date.toISOString().split("T")[0];

            const { data, error } = await supabase
              .from("athlete_workouts")
              .insert([
                {
                  athlete_id: selectedAthlete.id,
                  date: dayKey,
                  exercise_id: ex.id,
                  name: ex.name,
                  muscle_group: ex.muscle_group,
                  sets: JSON.stringify([
                    { sets: "", reps: "", weight: "", percent: "" },
                  ]),
                },
              ])
              .select();

            if (error) {
              console.error("❌ Insert failed:", error);
              return;
            }

            const newWorkout = data[0];
            setWorkoutsByDate((prev) => ({
              ...prev,
              [dayKey]: [...(prev[dayKey] || []), newWorkout],
            }));

            loadAthleteWorkouts(selectedAthlete.id);
          }}
          className={`min-h-[90px] p-2 flex flex-col justify-start rounded transition 
            ${isToday ? "border-2 border-blue-400" : "border border-slate-900"} 
            ${dayWorkouts.length ? "bg-slate-900/70" : "bg-slate-900"}`}
        >
          <span className="font-semibold text-slate-500 mb-1">{c.day}</span>

         {/* Day Workouts */}
{dayWorkouts.map((w, i) => (
  <div
    key={w.id || i}
    className="bg-slate-800/50 p-2 rounded mb-1 transition hover:bg-slate-700/40"
  >
    {/* Top Row: Exercise Name + Up Arrow + Delete */}
    <div className="flex items-center justify-between mb-1">
      <div className="text-xs text-white font-medium break-words leading-tight">
        {w.name}
      </div>

      <div className="flex items-center gap-1">
        {/* Move Up */}
        <button
          title="Move up"
          onClick={(e) => {
            e.stopPropagation();
            setWorkoutsByDate((prev) => {
              const list = [...(prev[dayKey] || [])];
              if (!list.length) return prev;

              // Move to bottom if already first
              const toIndex = i === 0 ? list.length - 1 : i - 1;
              const [item] = list.splice(i, 1);
              list.splice(toIndex, 0, item);
              return { ...prev, [dayKey]: list };
            });
          }}
          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
        >
          ↑
        </button>

        {/* Delete */}
        <button
          title="Remove"
          onClick={async (e) => {
            e.stopPropagation();
            const confirmDelete = confirm(`Remove "${w.name}" from this day?`);
            if (!confirmDelete) return;

            const { error } = await supabase
              .from("athlete_workouts")
              .delete()
              .eq("id", w.id);

            if (error) {
              console.error("❌ Error deleting workout:", error);
              return;
            }

            setWorkoutsByDate((prev) => {
              const updated = { ...prev };
              updated[w.date] = (updated[w.date] || []).filter(
                (item) => item.id !== w.id
              );
              return updated;
            });
          }}
          className="w-6 h-6 rounded bg-slate-800 hover:bg-red-600 text-slate-200 text-[12px] font-bold"
        >
          −
        </button>
      </div>
    </div>

    {/* Bottom Row: Inputs */}
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        placeholder="S"
        value={w.sets?.[0]?.sets || ""}
        onChange={(e) => handleUpdateSet(w, 0, "sets", e.target.value)}
        className="w-7 bg-slate-900 border border-slate-700 text-center rounded text-[10px] text-white appearance-none"
      />
      <input
        type="text"
        inputMode="numeric"
        placeholder="R"
        value={w.sets?.[0]?.reps || ""}
        onChange={(e) => handleUpdateSet(w, 0, "reps", e.target.value)}
        className="w-7 bg-slate-900 border border-slate-700 text-center rounded text-[10px] text-white appearance-none"
      />
      <input
        type="text"
        placeholder="W/%"
        value={w.sets?.[0]?.weight || w.sets?.[0]?.percent || ""}
        onChange={(e) => handleUpdateSet(w, 0, "weight", e.target.value)}
        className="w-10 bg-slate-900 border border-slate-700 text-center rounded text-[10px] text-white appearance-none"
      />
    </div>
  </div>
))}
        </div>
      );
    })}
  </div>
</section>
</div>

{/* Export Buttons */}
<div className="mt-6 flex gap-3 justify-end">
<button
  onClick={() => exportWorkoutsAsPDF(selectedAthlete, workoutsByDate, coachName)}

  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-sm font-medium"
>
  Export PDF
</button>
  <button
    onClick={() => exportWorkoutsAsText(selectedAthlete, workoutsByDate)}
    className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 text-sm font-medium"
  >
    Copy Text
  </button>
</div>


      {/* Invite Modal (✅ inside main return) */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Invite Athlete</h2>
            <div className="space-y-3">
              <input
                value={inviteFirst}
                onChange={(e) => setInviteFirst(e.target.value)}
                placeholder="First Name"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
              <input
                value={inviteLast}
                onChange={(e) => setInviteLast(e.target.value)}
                placeholder="Last Name"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) return;

                  const { error } = await supabase.from("athletes").insert([
                    {
                      coach_id: user.id,
                      first_name: inviteFirst,
                      last_name: inviteLast,
                    },
                  ]);

                  if (error) {
                    console.error("Insert error:", JSON.stringify(error, null, 2));
                    return;
                  }

                  setShowInviteModal(false);
                  setInviteEmail("");
                  setInviteFirst("");
                  setInviteLast("");
                  loadAthletes();
                }}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  ); // ✅ closes the return statement
} // ✅ closes AthletesPage component

