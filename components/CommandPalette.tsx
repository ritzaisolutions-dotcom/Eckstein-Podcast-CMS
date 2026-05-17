"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Command {
  label: string;
  description?: string;
  icon: string;
  href: string;
}

const COMMANDS: Command[] = [
  { label: "Neue Episode", description: "Long-Form Content anlegen", icon: "▶", href: "/episodes/new" },
  { label: "Neue Idee", description: "Ideen & Topics", icon: "⊕", href: "/mind-dump/new" },
  { label: "Gast anlegen", description: "Gäste-Datenbank", icon: "◉", href: "/guests/new" },
  { label: "Vault öffnen", description: "Passwörter & Accounts", icon: "⬘", href: "/vault" },
  { label: "OHE — Dashboard", description: "Offene · Heute · Everything", icon: "◈", href: "/" },
  { label: "Content", description: "Alle Content-Pieces", icon: "▤", href: "/content" },
  { label: "Analytics", description: "Views & Performance", icon: "◎", href: "/analytics" },
  { label: "Episode Prep", description: "Vorbereitung & roter Faden", icon: "◉", href: "/prep" },
  { label: "Das Fundament", description: "Newsletter & Artikel", icon: "✦", href: "/newsletter" },
  { label: "Media Library", description: "Uploads & Assets", icon: "◫", href: "/media" },
  { label: "Einstellungen", description: "Checklisten & Templates", icon: "◌", href: "/settings" },
  { label: "Episoden", description: "Long-Form übersicht", icon: "▶", href: "/episodes" },
];

function fuzzy(query: string, commands: Command[]) {
  if (!query.trim()) return commands;
  const q = query.toLowerCase();
  return commands.filter(c =>
    c.label.toLowerCase().includes(q) ||
    (c.description ?? "").toLowerCase().includes(q)
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = fuzzy(query, COMMANDS);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, []);

  const navigate = useCallback((href: string) => {
    router.push(href);
    close();
  }, [router, close]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) navigate(filtered[selected].href);
    if (e.key === "Escape") close();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(5,16,31,0.45)", backdropFilter: "blur(2px)" }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="w-full max-w-lg rounded shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        onKeyDown={onKeyDown}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Was möchtest du tun?"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-primary)" }}
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--cream-mid)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>ESC</kbd>
        </div>

        {/* Results */}
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Keine Aktion gefunden</li>
          ) : (
            filtered.map((cmd, i) => (
              <li key={cmd.href}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: i === selected ? "rgba(201,168,76,0.12)" : "transparent" }}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => navigate(cmd.href)}
                >
                  <span style={{ color: i === selected ? "var(--gold)" : "rgba(12,30,53,0.35)", fontSize: "0.8rem", width: 16 }}>{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-primary)" }}>{cmd.label}</span>
                    {cmd.description && (
                      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>{cmd.description}</span>
                    )}
                  </div>
                  {i === selected && (
                    <kbd className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: "var(--cream-mid)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}>↵</kbd>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t flex gap-4" style={{ borderColor: "var(--border)", background: "var(--cream-mid)" }}>
          {[["↑↓", "navigieren"], ["↵", "öffnen"], ["esc", "schließen"]].map(([key, desc]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg-surface)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}>{key}</kbd>
              <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}>{desc}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
