// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    display_name: "",
    organization_name: "",
    website: "",
    facebook: "",
    instagram: "",
    twitter: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Save to pending_coaches first
    const { error } = await supabase.from("pending_coaches").insert([
      {
        email: form.email,
        password: form.password,
        display_name: form.display_name,
        organization_name: form.organization_name,
        website: form.website,
        facebook: form.facebook,
        instagram: form.instagram,
        twitter: form.twitter,
      },
    ]);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Create Stripe session and redirect
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      // ✅ New method: redirect to session.url
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError("Error starting checkout: " + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-black via-slate-900 to-black text-white px-6 pt-32 pb-12">
      <div className="relative z-10 max-w-md w-full border border-white/10 rounded-2xl bg-white/5 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-2 uppercase">
          Create Your Account
        </h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Join Coachd to access your dashboard, build programs, and manage
          athletes. Complete payment after this step.
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            name="display_name"
            type="text"
            placeholder="Display Name"
            value={form.display_name}
            onChange={handleChange}
            required
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            name="organization_name"
            type="text"
            placeholder="Organization or Gym Name"
            value={form.organization_name}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            name="website"
            type="url"
            placeholder="Website (optional)"
            value={form.website}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            name="facebook"
            type="url"
            placeholder="Facebook URL"
            value={form.facebook}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            name="instagram"
            type="url"
            placeholder="Instagram URL"
            value={form.instagram}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            name="twitter"
            type="url"
            placeholder="Twitter URL"
            value={form.twitter}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue to Payment"}
          </button>

          {error && (
            <p className="text-red-500 text-center text-sm mt-2">{error}</p>
          )}
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Log in
          </a>
        </p>
      </div>

      <p className="text-xs text-slate-600 mt-8">
        © {new Date().getFullYear()} coachd.com
      </p>
    </div>
  );
}
