// app/pricing/page.tsx
"use client";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white flex items-center">
      <div className="w-full px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Pricing</h1>
          <p className="text-slate-400 mb-12">
            Simple plans that grow with your coaching business.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold mb-2">Starter</h2>
              <p className="text-slate-400 mb-4">Up to 10 athletes</p>
              <p className="text-3xl font-bold mb-6">
                $19<span className="text-lg">/mo</span>
              </p>
              <ul className="text-sm text-slate-300 space-y-2 mb-6">
                <li>✓ Full program builder</li>
                <li>✓ Assign workouts</li>
                <li>✓ Track progress</li>
              </ul>
              <button className="w-full rounded-lg bg-orange-600 text-white px-4 py-2 hover:bg-orange-500">
                Get Started
              </button>
            </div>

            {/* Growth */}
            <div className="rounded-2xl border-2 border-orange-500 bg-white/10 p-6">
              <h2 className="text-xl font-semibold mb-2">Growth</h2>
              <p className="text-slate-400 mb-4">Up to 50 athletes</p>
              <p className="text-3xl font-bold mb-6">
                $49<span className="text-lg">/mo</span>
              </p>
              <ul className="text-sm text-slate-300 space-y-2 mb-6">
                <li>✓ Everything in Starter</li>
                <li>✓ Client messaging</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <button className="w-full rounded-lg bg-orange-600 text-white px-4 py-2 hover:bg-orange-500">
                Get Started
              </button>
            </div>

            {/* Pro Coach */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold mb-2">Pro Coach</h2>
              <p className="text-slate-400 mb-4">Up to 200 athletes</p>
              <p className="text-3xl font-bold mb-6">
                $99<span className="text-lg">/mo</span>
              </p>
              <ul className="text-sm text-slate-300 space-y-2 mb-6">
                <li>✓ Everything in Growth</li>
                <li>✓ Custom branding</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="w-full rounded-lg bg-orange-600 text-white px-4 py-2 hover:bg-orange-500">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
