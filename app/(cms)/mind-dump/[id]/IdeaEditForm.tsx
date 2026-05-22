"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  initial: { title: string; bodyMd: string; tags: string[]; status: string };
}

export default function IdeaEditForm({ id, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: initial.title,
    bodyMd: initial.bodyMd,
    tags: initial.tags.join(", "),
    status: initial.status,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const res = await fetch(`/api/mind-dump/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, bodyMd: form.bodyMd, tags: JSON.stringify(tags), status: form.status }),
    });
    if (res.ok) {
      router.push("/mind-dump");
      router.refresh();
    } else {
      setSaving(false);
      alert("Fehler beim Speichern");
    }
  }

  async function handleDelete() {
    if (!confirm(`"${form.title}" wirklich löschen?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/mind-dump/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/mind-dump");
      router.refresh();
    } else {
      setDeleting(false);
      alert("Fehler beim Löschen");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="cms-card flex flex-col gap-4">
      <div>
        <label className="cms-label">TITEL *</label>
        <input
          required
          className="cms-input w-full"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Idee, Quote, Gast-Vorschlag..."
        />
      </div>

      <div>
        <label className="cms-label">DETAILS</label>
        <textarea
          className="cms-input w-full"
          rows={5}
          value={form.bodyMd}
          onChange={e => setForm(f => ({ ...f, bodyMd: e.target.value }))}
          placeholder="Mehr Details, Kontext, Links..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="cms-label">TAGS (kommagetrennt)</label>
          <input
            className="cms-input w-full"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="folgenidee, quote, gast"
          />
        </div>
        <div>
          <label className="cms-label">STATUS</label>
          <select className="cms-input w-full" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="idea">Idee</option>
            <option value="in_arbeit">In Arbeit</option>
            <option value="umgesetzt">Umgesetzt</option>
            <option value="verworfen">Verworfen</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-1.5 rounded border transition-colors"
          style={{ borderColor: "#c0392b", color: "#c0392b", fontFamily: "var(--font-cinzel)", opacity: deleting ? 0.6 : 1 }}
        >
          {deleting ? "Löschen..." : "LÖSCHEN"}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs px-4 py-1.5 rounded border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)" }}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-xs px-4 py-1.5 rounded"
            style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Speichern..." : "SPEICHERN"}
          </button>
        </div>
      </div>
    </form>
  );
}
