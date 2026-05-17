"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPrepPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ workingTitle: "", episodeNumber: "", plannedDate: "" });

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workingTitle: form.workingTitle,
        episodeNumber: form.episodeNumber || null,
        plannedDate: form.plannedDate || null,
      }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/prep/${id}`);
    } else {
      setSaving(false);
      alert("Fehler beim Speichern");
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--text-muted)" }}>← Zurück</button>
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Neuer Prep</h1>
      </div>

      <form onSubmit={handleSubmit} className="cms-card flex flex-col gap-4">
        <div>
          <label className="cms-label">ARBEITSTITEL *</label>
          <input
            required
            className="cms-input w-full"
            value={form.workingTitle}
            onChange={e => setForm(f => ({ ...f, workingTitle: e.target.value }))}
            placeholder="Warum du scheiterst — und was danach kommt"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cms-label">EPISODE #</label>
            <input
              type="number"
              min={1}
              className="cms-input w-full"
              value={form.episodeNumber}
              onChange={e => setForm(f => ({ ...f, episodeNumber: e.target.value }))}
              placeholder="13"
            />
          </div>
          <div>
            <label className="cms-label">GEPLANTES DATUM</label>
            <input
              type="date"
              className="cms-input w-full"
              value={form.plannedDate}
              onChange={e => setForm(f => ({ ...f, plannedDate: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => router.back()} className="text-xs px-4 py-2 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)" }}>
            Abbrechen
          </button>
          <button type="submit" disabled={saving} className="text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Erstellen..." : "PREP ERSTELLEN"}
          </button>
        </div>
      </form>
    </div>
  );
}
