"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

function useSupabaseSession() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export default function LoginPage() {
  const { session, loading: checkingSession } = useSupabaseSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!checkingSession && session) {
      router.push("/dashboard");
    }
  }, [checkingSession, session, router]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Checking session...
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/login.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Login form */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 bg-gradient-to-b from-slate-900 to-black border border-white/10 
                   rounded-2xl shadow-2xl p-10 w-full max-w-md text-white"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-400 uppercase tracking-wider">
          Coach Login
        </h1>

        {errorMsg && (
          <div className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-md p-3 text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL"
            required
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white 
                       placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            required
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white 
                       placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 text-white font-bold 
                       py-3 text-sm tracking-wider hover:bg-orange-400 transition disabled:opacity-50"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </div>

        <p className="mt-6 text-center text-slate-400 text-xs">
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-orange-400 hover:underline cursor-pointer"
          >
            SIGN UP
          </span>
        </p>
      </form>
    </div>
  );
}
