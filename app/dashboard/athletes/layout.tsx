// app/dashboard/athletes/layout.tsx
export default function AthletesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This removes the site nav and dashboard header for this page
  return (
    <div className="bg-slate-900 min-h-screen p-6">
      {children}
    </div>
  );
}
