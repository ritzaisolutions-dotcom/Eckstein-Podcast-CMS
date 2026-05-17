"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewIdeaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", bodyMd: "", tags: "", status: "idea" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const res = await fetch("/api/mind-dump", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, bodyMd: form.bodyMd, tags: JSON.stringify(tags), status: form.status }),
    });
    if (res.ok) {
      router.push("/mind-dump");
    } else {
      setSaving(false);
      alert("Fehler beim Speichern");
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--text-muted)" }}>← Zurück</button>
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Neue Idee</h1>
      </div>

      <form onSubmit={handleSubmit} className="cms-card flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TITEL *</label>
          <input required className="cms-input w-full" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Idee, Quote, Gast-Vorschlag..." />
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>DETAILS</label>
          <textarea className="cms-input w-full" rows={4} value={form.bodyMd} onChange={e => setForm(f => ({ ...f, bodyMd: e.target.value }))} placeholder="Mehr Details, Kontext, Links..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TAGS (kommagetrennt)</label>
            <input className="cms-input w-full" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="folgenidee, quote, gast" />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>STATUS</label>
            <select className="cms-input w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="idea">Idee</option>
              <option value="in_arbeit">In Arbeit</option>
              <option value="umgesetzt">Umgesetzt</option>
              <option value="verworfen">Verworfen</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => router.back()} className="text-xs px-4 py-2 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)" }}>
            Abbrechen
          </button>
          <button type="submit" disabled={saving} className="text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Speichern..." : "SPEICHERN"}
          </button>
        </div>
      </form>
    </div>
  );
}
