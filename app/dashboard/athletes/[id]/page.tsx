'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ArrowLeft,
  Save,
  Upload,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AthleteProfilePage() {
  const params = useParams<{ id: string }>();
  const athleteId = params?.id;
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [athlete, setAthlete] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [dob, setDob] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const getMonthGrid = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid: (Date | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(new Date(year, month, i));
    }
    return grid;
  };

  const shiftMonth = (offset: number) => {
    setCalendarMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + offset);
      return newMonth;
    });
  };

  const loadAthlete = async () => {
    const { data } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single();

    if (data) {
      setAthlete(data);
      setAvatarUrl(data.avatar_url || '');
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setHeightCm(data.height_cm || '');
      setWeightKg(data.weight_kg || '');
      setDob(data.date_of_birth || '');
      setStatus(data.status || '');
      setNotes(data.notes || '');
      setStartDate(data.program_start_date || '');
      setEndDate(data.program_end_date || '');
      if (data.program_id) loadProgram(data.program_id);
    }
  };

  const loadProgram = async (programId: string) => {
    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();
    setProgram(data);
  };

  const loadLibrary = async () => {
    const { data } = await supabase.from('programs').select('*');
    if (data) setLibrary(data);
  };

  useEffect(() => {
    if (athleteId) {
      loadAthlete();
      loadLibrary();
    }
  }, [athleteId]);

  const onSave = async () => {
    setSaving(true);

    const { data, error } = await supabase
  .from("athletes")
  .update({
    avatar_url: avatarUrl,
    first_name: firstName || null,
    last_name: lastName || null,
    email: email || null,
    phone: phone || null,
    height_cm: heightCm ? Number(heightCm) : null,
    weight_kg: weightKg ? Number(weightKg) : null,
    date_of_birth: dob || null,
    status: status || null,
    notes: notes || null,
  })
  .eq("id", athleteId)
  .select(); // ✅ returns the updated row(s)

console.log("Update result:", data, error);

setSaving(false);

if (!error) {
  alert("Profile saved successfully!");
  await loadAthlete(); // refresh local state
}
};



  const getWorkoutForDay = (date: Date) => {
  if (!athlete?.program_data || !athlete?.program_start_date) return [];

  const start = new Date(athlete.program_start_date);
  const end = athlete.program_end_date ? new Date(athlete.program_end_date) : null;

  if (date < start || (end && date > end)) return [];

  const daysSinceStart = Math.floor(
    (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const weekIndex = Math.floor(daysSinceStart / 7);
  const dayIndex = daysSinceStart % 7;

  const weeks = athlete.program_data?.weeks || [];
  const week = weeks[weekIndex];
  if (!week) return [];

  return week.days?.[dayIndex] || [];
};

  const unassignProgram = async () => {
    const { error } = await supabase
      .from("athletes")
      .update({
        program_id: null,
        program_start_date: null,
        program_end_date: null,
      })
      .eq("id", athleteId);

    if (!error) {
      setProgram(null);
      setStartDate('');
      setEndDate('');
      alert("Program unassigned");
      await loadAthlete();
    }
  };

const assignProgram = async () => {
  if (!selectedProgramId || !startDate) {
    alert("Please select a program and a start date");
    return;
  }

  try {
    setAssigning(true);

    // 1. get the full program JSON from programs table
    const { data: programData, error: programError } = await supabase
      .from("programs")
      .select("data")
      .eq("id", selectedProgramId)
      .single();

    if (programError || !programData) throw programError;

    // 2. update athlete with program_id + copied program_data
    const { error } = await supabase
      .from("athletes")
      .update({
        program_id: selectedProgramId,
        program_start_date: startDate,
        program_end_date: endDate || null,
        program_data: programData.data, // <-- deep copy JSON here
      })
      .eq("id", athleteId);

    if (error) throw error;

    // 3. reload athlete/program state
    await loadAthlete();
    await loadProgram(selectedProgramId);

    setShowAssign(false);
  } catch (err: any) {
    alert("Failed to assign program.");
    console.error(err);
  } finally {
    setAssigning(false);
  }
};

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !athleteId) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${athleteId}-${Date.now()}.${fileExt}`;

    // upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      return;
    }

    // get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    // update athlete row
    const { error: updateError } = await supabase
      .from('athletes')
      .update({ avatar_url: publicUrl })
      .eq('id', athleteId);

    if (updateError) {
      alert("DB update failed: " + updateError.message);
      return;
    }

    // update local state
    setAvatarUrl(publicUrl);
    setAthlete({ ...athlete, avatar_url: publicUrl });
  }

  const fullName = `${firstName || "Unnamed"} ${lastName || ""}`.trim();
  const monthGrid = getMonthGrid(calendarMonth);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white px-6 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header Buttons */}
      <div className="flex justify-end gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <button
          onClick={() => setShowAssign(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
        >
          <Plus size={16} /> Assign Program
        </button>

        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save
        </button>
      </div>

      {/* Athlete Bio */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div className="flex items-center gap-6">
          <img
            src={avatarUrl || '/default-avatar.png'}
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover border border-white/15"
          />
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-white">{fullName}</h2>
            <p className="text-sm text-slate-400 italic">
              {program ? `Program: ${program.name}` : "No program assigned"}
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white"
            >
              <Upload size={16} /> Upload Avatar
            </button>
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={firstName || ""} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className="rounded bg-white/10 px-3 py-2 text-sm" />
          <input value={lastName || ""} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" className="rounded bg-white/10 px-3 py-2 text-sm" />
          <input value={email || ""} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded bg-white/10 px-3 py-2 text-sm" />
          <input value={phone || ""} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded bg-white/10 px-3 py-2 text-sm" />
          <input value={heightCm || ""} onChange={(e) => setHeightCm(e.target.value)} placeholder="Height (cm)" className="rounded bg-white/10 px-3 py-2 text-sm" />
          <input value={weightKg || ""} onChange={(e) => setWeightKg(e.target.value)} placeholder="Weight (kg)" className="rounded bg-white/10 px-3 py-2 text-sm" />
          <input value={dob || ""} onChange={(e) => setDob(e.target.value)} type="date" className="rounded bg-white/10 px-3 py-2 text-sm" />
          <select value={status || ""} onChange={(e) => setStatus(e.target.value)} className="rounded bg-white/10 px-3 py-2 text-sm">
            <option value="On Track">On Track</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <textarea
          value={notes || ""}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Coach notes..."
          rows={4}
          className="w-full rounded bg-white/10 px-3 py-2 text-sm"
        />
      </section>

      {/* Calendar */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Calendar</h2>
          <div className="flex gap-2">
            <button onClick={() => shiftMonth(-1)} className="p-1 rounded border border-white/10 hover:bg-white/10">
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm text-slate-300">
              {calendarMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button onClick={() => shiftMonth(1)} className="p-1 rounded border border-white/10 hover:bg-white/10">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-sm text-center text-slate-400 mb-2">
          {DAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthGrid.map((date, idx) => {
            if (!date) {
              return <div key={`blank-${idx}`} className="min-h-[100px] rounded bg-white/5" />;
            }

            const isToday = date.toDateString() === new Date().toDateString();
            const workouts = getWorkoutForDay(date);

            return (
              <div
                key={date.toISOString()}
                className={`rounded border min-h-[100px] p-2 flex flex-col gap-1 ${
                  isToday ? "bg-blue-700 border-blue-400 shadow-md" : "bg-white/5 border-white/10"
                }`}
              >
                <div className="text-xs text-slate-400 font-bold">
                  {date.getDate()}
                  {isToday && <span className="ml-1 text-emerald-300">(Today)</span>}
                </div>

                {workouts.length === 0 ? (
                  <span className="text-xs text-slate-600 italic">Rest</span>
                ) : (
                  workouts.map((w, i) => (
                    <div
                      key={i}
                      className="text-xs px-2 py-1 rounded cursor-pointer transition bg-blue-600 text-white"
                    >
                      {w.exercise}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        {program && (
          <div className="mt-6 text-right">
            <button
              onClick={unassignProgram}
              className="text-sm px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
            >
              Unassign Program
            </button>
          </div>
        )}
      </section>

      
      {/* Assign Program Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-b from-slate-900 to-black border border-white/10 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white border-b-2 border-blue-500 inline-block pb-1">
                Assign Program
              </h3>
              <button
                onClick={() => setShowAssign(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Program Dropdown */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  Select Program
                </label>
                <Select onValueChange={(val) => setSelectedProgramId(val)}>
                  <SelectTrigger className="w-full rounded-lg bg-white/10 border border-white/10 text-blue-400">
                    <SelectValue placeholder="— Choose a program —" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border border-white/10 rounded-lg shadow-lg">
                    {library.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="text-blue-400 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Pickers */}
              <div className="flex gap-4">
                <div className="flex flex-col w-1/2">
                  <label className="text-xs text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col w-1/2">
                  <label className="text-xs text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-end">
              <button
                onClick={assignProgram}
                disabled={assigning}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm text-white font-medium shadow-md transition disabled:opacity-60"
              >
                {assigning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {assigning ? "Assigning..." : "Assign Program"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

