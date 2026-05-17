"use client";

import { useState, useEffect, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

interface VaultEntry {
  id: string;
  title: string;
  category: string;
  loginUrl?: string;
  username?: string;
  email?: string;
  quickLinks: Array<{ label: string; url: string }>;
  tags: string[];
  lastRotatedAt?: string;
  stale: boolean;
  hasPassword: boolean;
  hasRecoveryCodes: boolean;
  hasApiTokens: boolean;
  hasNotes: boolean;
}

async function fetchEntry(id: string): Promise<VaultEntry | null> {
  const res = await fetch(`/api/vault/entry/${id}`);
  if (!res.ok) return null;
  return res.json() as Promise<VaultEntry>;
}

async function revealField(id: string, field: string): Promise<string | null> {
  const res = await fetch("/api/vault/reveal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, field }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { value?: string };
  return data.value ?? null;
}

async function deleteEntry(id: string): Promise<boolean> {
  const res = await fetch(`/api/vault/entry/${id}`, { method: "DELETE" });
  return res.ok;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      startTransition(() => {
        setTimeout(() => setCopied(false), 20_000);
      });
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs px-2 py-0.5 rounded border"
      style={{
        fontFamily: "var(--font-cinzel)",
        fontSize: "0.55rem",
        letterSpacing: "0.08em",
        borderColor: copied ? "var(--gold)" : "var(--border)",
        color: copied ? "var(--gold)" : "var(--text-muted)",
        background: "var(--bg-surface)",
      }}
    >
      {copied ? "Kopiert" : label}
    </button>
  );
}

function SecretField({
  label,
  fieldKey,
  entryId,
  hasValue,
}: {
  label: string;
  fieldKey: string;
  entryId: string;
  hasValue: boolean;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearTimer, setClearTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  if (!hasValue) return null;

  async function handleReveal() {
    setLoading(true);
    const value = await revealField(entryId, fieldKey);
    setLoading(false);
    if (value) {
      setRevealed(value);
      if (clearTimer) clearTimeout(clearTimer);
      const timer = setTimeout(() => setRevealed(null), 60_000);
      setClearTimer(timer);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="cms-label">{label}</span>
      <div className="flex items-center gap-2">
        {revealed ? (
          <>
            <code
              className="flex-1 px-3 py-2 rounded text-sm break-all"
              style={{
                background: "var(--bg-surface-2)",
                color: "var(--navy)",
                fontFamily: "monospace",
                border: "1px solid var(--border)",
                whiteSpace: "pre-wrap",
              }}
            >
              {revealed}
            </code>
            <CopyButton value={revealed} label="Kopieren" />
            <button
              type="button"
              onClick={() => setRevealed(null)}
              className="text-xs px-2 py-0.5 rounded border"
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.55rem",
                borderColor: "var(--border)",
                color: "var(--text-muted)",
              }}
            >
              Verbergen
            </button>
          </>
        ) : (
          <>
            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}>
              ********
            </span>
            <button
              type="button"
              onClick={handleReveal}
              disabled={loading}
              className="text-xs px-2 py-0.5 rounded border transition-colors"
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.55rem",
                letterSpacing: "0.08em",
                borderColor: "var(--gold)",
                color: "var(--gold)",
                background: "transparent",
              }}
            >
              {loading ? "..." : "Anzeigen"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [entry, setEntry] = useState<VaultEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEntry(id).then((value) => {
      setEntry(value);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Eintrag wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.")) {
      return;
    }
    setDeleting(true);
    const ok = await deleteEntry(id);
    if (ok) {
      router.push("/vault");
      return;
    }
    setDeleting(false);
    alert("Fehler beim Loeschen.");
  }

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}>Lade...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        <p style={{ color: "#e57373", fontFamily: "var(--font-eb-garamond)" }}>Eintrag nicht gefunden.</p>
        <Button variant="secondary" onClick={() => router.push("/vault")} className="mt-4">
          Zurueck
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <PageHeader
        title={entry.title}
        subtitle={entry.category}
        actions={(
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push("/vault")}>
              Zurueck
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? "..." : "Loeschen"}
            </Button>
          </div>
        )}
      />

      {entry.stale ? (
        <div
          className="mb-4 px-4 py-2 rounded border text-sm"
          style={{
            borderColor: "rgba(229,115,115,0.4)",
            background: "rgba(229,115,115,0.08)",
            color: "#c62828",
            fontFamily: "var(--font-eb-garamond)",
          }}
        >
          Passwort veraltet. Zuletzt geaendert:{" "}
          {entry.lastRotatedAt ? new Date(entry.lastRotatedAt).toLocaleDateString("de") : "unbekannt"}
        </div>
      ) : null}

      <div className="cms-card flex flex-col gap-5">
        {entry.loginUrl ? (
          <div>
            <span className="cms-label">Login-URL</span>
            <a
              href={entry.loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--gold)", fontFamily: "var(--font-eb-garamond)" }}
            >
              {entry.loginUrl} -&gt;
            </a>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          {entry.username ? (
            <div>
              <span className="cms-label">Benutzername</span>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--navy)" }}>
                  {entry.username}
                </span>
                <CopyButton value={entry.username} label="Kopieren" />
              </div>
            </div>
          ) : null}
          {entry.email ? (
            <div>
              <span className="cms-label">E-Mail</span>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--navy)" }}>
                  {entry.email}
                </span>
                <CopyButton value={entry.email} label="Kopieren" />
              </div>
            </div>
          ) : null}
        </div>

        <SecretField label="Passwort" fieldKey="password" entryId={id} hasValue={entry.hasPassword} />
        <SecretField label="Recovery Codes" fieldKey="recoveryCodes" entryId={id} hasValue={entry.hasRecoveryCodes} />
        <SecretField label="API Keys / Tokens" fieldKey="apiTokens" entryId={id} hasValue={entry.hasApiTokens} />
        <SecretField label="Notizen" fieldKey="notes" entryId={id} hasValue={entry.hasNotes} />

        {entry.quickLinks.length > 0 ? (
          <div>
            <span className="cms-label">Quick-Links</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {entry.quickLinks.map((ql, index) => (
                <a
                  key={`${ql.url}-${index}`}
                  href={ql.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded border"
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    borderColor: "var(--border)",
                    color: "var(--gold)",
                    background: "var(--bg-surface)",
                  }}
                >
                  {ql.label} -&gt;
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {entry.tags.length > 0 ? (
          <div>
            <span className="cms-label">Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "var(--bg-surface-2)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.55rem",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
