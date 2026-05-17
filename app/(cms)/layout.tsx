import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh" style={{ background: "var(--bg-app)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
