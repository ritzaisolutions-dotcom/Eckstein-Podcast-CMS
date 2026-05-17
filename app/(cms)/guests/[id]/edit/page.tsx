"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { use } from "react";

export default function EditGuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", status: "angefragt", topics: "", bioMd: "", socials_instagram: "", socials_x: "", socials_website: "" });

  useEffect(() => {
    fetch(`/api/guests/${id}`)
      .then(r => r.json())
      .then(data => {
        const socials = (() => { try { return JSON.parse(data.socials ?? "{}"); } catch { return {}; } })();
        const topics = (() => { try { return (JSON.parse(data.topics ?? "[]") as string[]).join(", "); } catch { return ""; } })();
        setForm({
          name: data.name ?? "",
          status: data.status ?? "angefragt",
          topics,
          bioMd: data.bioMd ?? "",
          socials_instagram: socials.instagram ?? "",
          socials_x: socials.x ?? "",
          socials_website: socials.website ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const topics = JSON.stringify(form.topics.split(",").map(t => t.trim()).filter(Boolean));
    const socials = JSON.stringify({ instagram: form.socials_instagram, x: form.socials_x, website: form.socials_website });
    const res = await fetch(`/api/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, status: form.status, topics, bioMd: form.bioMd, socials }),
    });
    if (res.ok) {
      router.push(`/guests/${id}`);
    } else {
      setSaving(false);
      alert("Fehler beim Speichern");
    }
  }

  if (loading) {
    return <div className="cms-card py-8 text-center text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Lade...</div>;
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--text-muted)" }}>← Zurück</button>
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Gast bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit} className="cms-card flex flex-col gap-4">
        <div>
          <label className="cms-label">NAME *</label>
          <input required className="cms-input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Max Mustermann" />
        </div>
        <div>
          <label className="cms-label">STATUS</label>
          <select className="cms-input w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="angefragt">Angefragt</option>
            <option value="zugesagt">Zugesagt</option>
            <option value="aufgenommen">Aufgenommen</option>
            <option value="mehrfach">Mehrfach aufgenommen</option>
          </select>
        </div>
        <div>
          <label className="cms-label">THEMEN (kommagetrennt)</label>
          <input className="cms-input w-full" value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))} placeholder="Unternehmertum, Führung, Glaube" />
        </div>
        <div>
          <label className="cms-label">BIO</label>
          <textarea className="cms-input w-full" rows={3} value={form.bioMd} onChange={e => setForm(f => ({ ...f, bioMd: e.target.value }))} placeholder="Kurzbeschreibung des Gastes..." />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="cms-label">INSTAGRAM</label>
            <input className="cms-input w-full" value={form.socials_instagram} onChange={e => setForm(f => ({ ...f, socials_instagram: e.target.value }))} placeholder="@handle" />
          </div>
          <div>
            <label className="cms-label">X / TWITTER</label>
            <input className="cms-input w-full" value={form.socials_x} onChange={e => setForm(f => ({ ...f, socials_x: e.target.value }))} placeholder="@handle" />
          </div>
          <div>
            <label className="cms-label">WEBSITE</label>
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
