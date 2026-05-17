"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGuestPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", status: "angefragt", topics: "", bioMd: "", socials_instagram: "", socials_x: "", socials_website: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const topics = form.topics.split(",").map(t => t.trim()).filter(Boolean);
    const socials = JSON.stringify({ instagram: form.socials_instagram, x: form.socials_x, website: form.socials_website });
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, status: form.status, topics: JSON.stringify(topics), bioMd: form.bioMd, socials }),
    });
    if (res.ok) {
      router.push("/guests");
    } else {
      setSaving(false);
      alert("Fehler beim Speichern");
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--text-muted)" }}>← Zurück</button>
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Neuer Gast</h1>
      </div>

      <form onSubmit={handleSubmit} className="cms-card flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>NAME *</label>
          <input required className="cms-input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Max Mustermann" />
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>STATUS</label>
          <select className="cms-input w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="angefragt">Angefragt</option>
            <option value="zugesagt">Zugesagt</option>
            <option value="aufgenommen">Aufgenommen</option>
            <option value="mehrfach">Mehrfach aufgenommen</option>
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>THEMEN (kommagetrennt)</label>
          <input className="cms-input w-full" value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))} placeholder="Unternehmertum, Führung, Glaube" />
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>BIO</label>
          <textarea className="cms-input w-full" rows={3} value={form.bioMd} onChange={e => setForm(f => ({ ...f, bioMd: e.target.value }))} placeholder="Kurzbeschreibung des Gastes..." />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>INSTAGRAM</label>
            <input className="cms-input w-full" value={form.socials_instagram} onChange={e => setForm(f => ({ ...f, socials_instagram: e.target.value }))} placeholder="@handle" />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>X / TWITTER</label>
            <input className="cms-input w-full" value={form.socials_x} onChange={e => setForm(f => ({ ...f, socials_x: e.target.value }))} placeholder="@handle" />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>WEBSITE</label>
            <input className="cms-input w-full" value={form.socials_website} onChange={e => setForm(f => ({ ...f, socials_website: e.target.value }))} placeholder="https://..." />
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
