export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white p-10 space-y-8">
      <h1 className="text-4xl font-extrabold text-center text-blue-400">
        🚀 Tailwind Debug Page
      </h1>

      {/* Colored Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg text-center">Red Box</div>
        <div className="bg-green-500 text-black p-6 rounded-lg shadow-lg text-center">Green Box</div>
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg text-center">Blue Box</div>
        <div className="bg-yellow-400 text-black p-6 rounded-lg shadow-lg text-center">Yellow Box</div>
      </div>

      {/* Typography Test */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold underline decoration-blue-500">Heading 2</h2>
        <p className="text-lg text-slate-300">This is a paragraph with lighter text.</p>
        <p className="text-sm italic text-slate-400">This is small italic text.</p>
      </div>

      {/* Button Test */}
      <div className="flex gap-4">
        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold">
          Primary Button
        </button>
        <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
          Success Button
        </button>
        <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold">
          Danger Button
        </button>
      </div>

      {/* Gradient Test */}
      <div className="h-32 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center font-bold text-xl">
        Gradient Background
      </div>

      {/* Card Test */}
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold mb-2">Card Component</h3>
        <p className="text-slate-300 text-sm">
          This card uses semi-transparent backgrounds, borders, and rounded corners.
        </p>
      </div>
    </div>
  );
}


