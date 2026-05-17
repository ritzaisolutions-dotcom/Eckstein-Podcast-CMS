interface StatCardProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className="rounded px-4 py-3 border"
      style={{
        background: "var(--bg-surface)",
        borderColor: accent ? "var(--gold)" : "var(--border)",
        borderTopWidth: accent ? 2 : 1,
      }}
    >
      <div
        className="text-2xl font-medium"
        style={{ fontFamily: "var(--font-cinzel)", color: accent ? "var(--gold)" : "var(--navy)" }}
      >
        {value}
      </div>
      <div
        className="text-xs mt-0.5 uppercase tracking-wider"
        style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", fontSize: "0.6rem" }}
      >
        {label}
      </div>
    </div>
  );
}
