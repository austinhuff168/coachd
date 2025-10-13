"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function NewAthleteForm({ coachId }: { coachId: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const id = uuidv4();
    let avatar_url: string | null = null;

    // Upload avatar if provided
    if (avatarFile) {
      const path = `${id}/${avatarFile.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile);
      if (upErr) {
        console.error("Avatar upload error:", upErr);
        setLoading(false);
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      avatar_url = pub?.publicUrl ?? null;
    }

    // Insert athlete row
    const { error } = await supabase.from("athletes").insert({
      id,
      coach_id: coachId,
      first_name: firstName,
      last_name: lastName,
      email,
      status: "On Track",
      avatar_url,
      // performance defaults (ensure columns exist in table)
      sessions_7d: 0,
      adherence_pct: 100,
      weekly_volume: 0,
      last_session: "Today",
    });

    if (error) {
      console.error("Insert athlete error:", error);
    } else {
      setSuccess(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setAvatarFile(null);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-xl bg-white shadow-sm">
      <h2 className="text-lg font-semibold">Add Athlete</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
        className="w-full"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Athlete"}
      </button>

      {success && <p className="text-emerald-600 text-sm">Athlete added successfully!</p>}
    </form>
  );
}
