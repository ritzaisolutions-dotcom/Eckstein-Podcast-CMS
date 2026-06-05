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
  { label: "Neuer Content", description: "Schnell anlegen — LFC, SFC, Artikel, Post", icon: "▶", href: "/content/new" },
  { label: "Neuer LFC", description: "Long-Form Episode", icon: "▶", href: "/content/new?type=lfc" },
  { label: "Neuer Short", description: "SFC / Clip", icon: "▷", href: "/content/new?type=sfc" },
  { label: "Neue Idee", description: "Ideen & Topics", icon: "⊕", href: "/mind-dump/new" },
  { label: "Gast anlegen", description: "Gäste-Datenbank", icon: "◉", href: "/guests/new" },
  { label: "Vault öffnen", description: "Passwörter & Accounts", icon: "⬘", href: "/vault" },
  { label: "OHE — Dashboard", description: "Offene · Heute · Everything", icon: "◈", href: "/" },
  { label: "Content Hub", description: "Board & Tabelle — alle Pieces", icon: "▤", href: "/content" },
  { label: "Analytics", description: "Views & Performance", icon: "◎", href: "/analytics" },
  { label: "Episode Prep", description: "Vorbereitung & roter Faden", icon: "◉", href: "/prep" },
  { label: "Das Fundament", description: "Artikel & Newsletter", icon: "✦", href: "/content?type=article" },
  { label: "Media Library", description: "Uploads & Assets", icon: "◫", href: "/media" },
  { label: "Einstellungen", description: "Checklisten & Templates", icon: "◌", href: "/settings" },
  { label: "Episoden", description: "Long-Form im Hub", icon: "▶", href: "/content?type=lfc" },
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
      style={{ background: "rgba(5,16,31,0.55)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="w-full max-w-lg rounded shadow-2xl overflow-hidden cms-glass-strong"
        style={{ border: "1px solid var(--glass-border-subtle)" }}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--glass-border-subtle)" }}>
          <span style={{ color: "var(--text-on-glass-muted)", fontSize: "0.8rem" }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Was möchtest du tun?"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--cream)" }}
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(245,238,216,0.08)", color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>ESC</kbd>
        </div>

        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>Keine Aktion gefunden</li>
          ) : (
            filtered.map((cmd, i) => (
              <li key={cmd.href}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: i === selected ? "rgba(201,168,76,0.12)" : "transparent" }}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => navigate(cmd.href)}
                >
                  <span style={{ color: i === selected ? "var(--gold-light)" : "var(--text-on-glass-muted)", fontSize: "0.8rem", width: 16 }}>{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--cream)" }}>{cmd.label}</span>
                    {cmd.description && (
                      <span className="ml-2 text-xs" style={{ color: "var(--text-on-glass-muted)" }}>{cmd.description}</span>
                    )}
                  </div>
                  {i === selected && (
                    <kbd className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(245,238,216,0.08)", color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}>↵</kbd>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="px-4 py-2 border-t flex gap-4" style={{ borderColor: "var(--glass-border-subtle)", background: "rgba(245,238,216,0.04)" }}>
          {[["↑↓", "navigieren"], ["↵", "öffnen"], ["esc", "schließen"]].map(([key, desc]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(245,238,216,0.08)", color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}>{key}</kbd>
              <span className="text-xs" style={{ color: "var(--text-on-glass-muted)", fontFamily: "var(--font-eb-garamond)" }}>{desc}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
