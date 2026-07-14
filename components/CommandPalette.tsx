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
  { label: "Links", description: "Plattformen & Quick-Links", icon: "⛓", href: "/links" },
  { label: "Thumbnail Generator", description: "YouTube-Template · 1280×720 PNG", icon: "◧", href: "/thumbnail" },
  { label: "Infobox Generator", description: "CapCut-Overlays · PNG transparent", icon: "◈", href: "/infobox" },
  { label: "RAIS Post", description: "Social Post · 1080×1080 PNG", icon: "◫", href: "/rais-post" },
];

function fuzzy(query: string, commands: Command[]) {
  const q = query.toLowerCase().trim();
  if (!q) return commands;
  return commands.filter(c =>
    c.label.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q),
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = fuzzy(query, COMMANDS);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function go(href: string) {
    close();
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: "rgba(5,16,31,0.75)" }}
      onClick={close}
    >
      <div
        className="cms-glass-strong w-full max-w-md rounded overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={e => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && results[active]) go(results[active].href);
          }}
          placeholder="Suchen…"
          className="w-full px-4 py-3 border-b bg-transparent outline-none text-sm"
          style={{ borderColor: "var(--border)", color: "var(--cream)", fontFamily: "var(--font-eb-garamond)" }}
        />
        <ul className="py-1 max-h-64 overflow-y-auto">
          {results.map((cmd, i) => (
            <li key={cmd.href}>
              <button
                type="button"
                onClick={() => go(cmd.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                style={{
                  background: i === active ? "rgba(201,168,76,0.12)" : "transparent",
                  color: "var(--cream)",
                  fontFamily: "var(--font-eb-garamond)",
                }}
              >
                <span style={{ color: "var(--gold-light)" }}>{cmd.icon}</span>
                <span>
                  <span className="block">{cmd.label}</span>
                  {cmd.description && (
                    <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{cmd.description}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
