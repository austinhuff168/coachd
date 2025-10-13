// app/dashboard/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | COACHD",
  description: "Manage your athletes and programs.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-black to-slate-900 text-white">
      {children}
    </div>
  );
}
