"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

const CATEGORIES = [
  { value: "platform", label: "Plattform" },
  { value: "infra", label: "Infra" },
  { value: "mail", label: "Mail" },
  { value: "payment", label: "Zahlung" },
  { value: "tool", label: "Tool" },
  { value: "misc", label: "Misc" },
];

async function createEntry(data: Record<string, string>): Promise<{ id?: string; error?: string }> {
  const res = await fetch("/api/vault/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json() as Record<string, string>;
  if (!res.ok) return { error: json.error ?? "Fehler beim Speichern." };
  return { id: json.id };
}

export default function VaultNewPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "platform",
    loginUrl: "",
    username: "",
    email: "",
    password: "",
    recoveryCodes: "",
    apiTokens: "",
    notes: "",
    quickLinks: "",
    tags: "",
  });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createEntry(form);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/vault");
      }
    });
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <PageHeader
        title="Neuer Vault-Eintrag"
        subtitle="Account & Zugangsdaten"
      />

      <div className="mb-5 px-4 py-3 rounded border text-sm" style={{ borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)", color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
        Passwörter werden AES-256-GCM verschlüsselt gespeichert. Nur der Server (mit VAULT_MASTER_KEY) kann entschlüsseln.
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label className="cms-label">Bezeichnung *</label>
          <input
            required
            className="cms-input w-full"
            placeholder="z.B. YouTube Eckstein Kanal"
            value={form.title}
            onChange={e => set("title", e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="cms-label">Kategorie</label>
          <select
            className="cms-input w-full"
            value={form.category}
            onChange={e => set("category", e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Login URL */}
        <div>
          <label className="cms-label">Login-URL</label>
          <input
            type="url"
            className="cms-input w-full"
            placeholder="https://..."
            value={form.loginUrl}
            onChange={e => set("loginUrl", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cms-label">Benutzername</label>
            <input
              className="cms-input w-full"
              placeholder="username"
              value={form.username}
              onChange={e => set("username", e.target.value)}
            />
          </div>
          <div>
            <label className="cms-label">E-Mail</label>
            <input
              type="email"
              className="cms-input w-full"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => set("email", e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="cms-label">Passwort (wird verschlüsselt gespeichert)</label>
          <input
            type="password"
            className="cms-input w-full"
            placeholder="••••••••"
            value={form.password}
            onChange={e => set("password", e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {/* Recovery Codes */}
        <div>
          <label className="cms-label">Recovery Codes (werden verschlüsselt gespeichert)</label>
          <textarea
            className="cms-input w-full"
            rows={3}
            placeholder="Einen pro Zeile..."
            value={form.recoveryCodes}
            onChange={e => set("recoveryCodes", e.target.value)}
          />
        </div>

        {/* API Tokens */}
        <div>
          <label className="cms-label">API Keys / Tokens (werden verschlüsselt gespeichert)</label>
          <textarea
            className="cms-input w-full"
            rows={3}
            placeholder='JSON oder Freitext: {"key": "..."}'
            value={form.apiTokens}
            onChange={e => set("apiTokens", e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="cms-label">Notizen (werden verschlüsselt gespeichert)</label>
          <textarea
            className="cms-input w-full"
            rows={3}
            placeholder="Weitere Infos..."
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
          />
        </div>

        {/* Quick Links */}
        <div>
          <label className="cms-label">Quick-Links (JSON: [{"{"}label,url{"}"}])</label>
          <input
            className="cms-input w-full"
            placeholder='[{"label":"Creator Studio","url":"https://studio.youtube.com"}]'
            value={form.quickLinks}
            onChange={e => set("quickLinks", e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="cms-label">Tags (kommagetrennt)</label>
          <input
            className="cms-input w-full"
            placeholder="video, api, social"
            value={form.tags}
            onChange={e => set("tags", e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "#e57373", fontFamily: "var(--font-eb-garamond)" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending || !form.title}>
            {isPending ? "Speichern..." : "Eintrag erstellen"}
          </Button>
          <Button variant="secondary" type="button" onClick={() => router.push("/vault")}>
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
}
