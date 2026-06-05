export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cms-shell flex min-h-dvh">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
