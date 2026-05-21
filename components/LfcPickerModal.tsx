"use client";

import { useState, useEffect, useRef } from "react";

interface LfcOption {
  id: string;
  title: string;
  episodeNumber: number | null;
  typeIndex: number | null;
}

interface Props {
  onSelect: (lfc: LfcOption) => void;
  onSkip: () => void;
}

export default function LfcPickerModal({ onSelect, onSkip }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LfcOption[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ type: "lfc" });
    if (query) params.set("q", query);
    fetch(`/api/content?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,16,31,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="cms-card w-full max-w-lg flex flex-col gap-4"
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div>
          <h2 className="cms-card-title">LFC-Episode verknüpfen</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
            Stammt dieser Short aus einer Long-Form Episode?
          </p>
        </div>

        {/* Search */}
        <input
          ref={inputRef}
          type="text"
          className="cms-input"
          placeholder="Episode suchen..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {/* Results */}
        <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 320, minHeight: 80 }}>
          {loading ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Lade...</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Keine LFC-Episoden gefunden.</p>
          ) : (
            results.map(lfc => (
              <button
                key={lfc.id}
                type="button"
                onClick={() => onSelect(lfc)}
                className="text-left px-3 py-2.5 rounded border transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: "transparent",
                  fontFamily: "var(--font-eb-garamond)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--cream-mid)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--navy)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                }}
              >
                <div className="flex items-baseline gap-2">
                  {lfc.episodeNumber && (
                    <span className="text-xs shrink-0" style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem" }}>
                      #{lfc.episodeNumber}
                    </span>
                  )}
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{lfc.title}</span>
                  {lfc.typeIndex && (
                    <span className="text-xs ml-auto shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
                      LFC-{lfc.typeIndex}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs px-4 py-2 rounded border transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.07em",
            }}
          >
            Überspringen
          </button>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-eb-garamond)" }}>
            Verknüpfung kann später geändert werden
          </p>
        </div>
      </div>
    </div>
  );
}
