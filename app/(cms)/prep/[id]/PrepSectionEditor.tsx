"use client";
import { useState } from "react";

interface Section {
  id: string;
  prepId: string;
  slug: string;
  label: string;
  bodyMd: string | null;
  status: string;
  orderIndex: number;
}

export default function PrepSectionEditor({ prepId, initialSections }: { prepId: string; initialSections: Section[] }) {
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState<string | null>(null);

  async function saveSection(section: Section) {
    setSaving(section.id);
    await fetch(`/api/prep/${prepId}/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bodyMd: section.bodyMd, status: section.status }),
    });
    setSaving(null);
  }

  function updateSection(id: string, field: "bodyMd" | "status", value: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    offen:      { bg: "var(--cream-mid)",           color: "var(--text-muted)" },
    bearbeitet: { bg: "rgba(201,168,76,0.15)",       color: "var(--gold)" },
    final:      { bg: "rgba(76,175,125,0.12)",       color: "#4caf7d" },
  };

  if (sections.length === 0) {
    return (
      <div className="cms-card text-center py-12">
        <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Keine Sections — Prep neu anlegen oder Sections fehlen.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map(section => {
        const statusStyle = STATUS_COLORS[section.status] ?? STATUS_COLORS.offen;
        return (
          <div key={section.id} className="cms-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)", letterSpacing: "0.06em" }}>
                {section.label}
              </h3>
              <div className="flex items-center gap-2">
                {(["offen", "bearbeitet", "final"] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateSection(section.id, "status", s)}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.52rem",
                      letterSpacing: "0.06em",
                      background: section.status === s ? statusStyle.bg : "transparent",
                      color: section.status === s ? statusStyle.color : "var(--text-muted)",
                      border: `1px solid ${section.status === s ? statusStyle.color : "var(--border)"}`,
                    }}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => saveSection(section)}
                  disabled={saving === section.id}
                  className="text-xs px-3 py-1 rounded"
                  style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", opacity: saving === section.id ? 0.6 : 1 }}
                >
                  {saving === section.id ? "..." : "Speichern"}
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              className="cms-input w-full"
              style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" }}
              placeholder={`${section.label}...`}
              value={section.bodyMd ?? ""}
              onChange={e => updateSection(section.id, "bodyMd", e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
