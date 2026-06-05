"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LIFECYCLE_OPTIONS, type LifecycleStage } from "@/lib/lifecycle";

interface LifecycleStepperProps {
  contentId: string;
  initialStage: string;
  onStageChange?: (stage: string) => void;
}

export default function LifecycleStepper({ contentId, initialStage, onStageChange }: LifecycleStepperProps) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setStage(initialStage);
  }, [contentId, initialStage]);

  async function selectStage(next: LifecycleStage) {
    if (next === stage || pending) return;
    const prev = stage;
    setError("");
    setStage(next);
    setPending(next);
    onStageChange?.(next);

    try {
      const res = await fetch(`/api/content/${contentId}/lifecycle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Speichern fehlgeschlagen");
      }
      router.refresh();
    } catch (e) {
      setStage(prev);
      onStageChange?.(prev);
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {LIFECYCLE_OPTIONS.map(o => {
          const active = stage === o.value;
          const isPending = pending === o.value;
          return (
            <button
              key={o.value}
              type="button"
              disabled={!!pending}
              onClick={() => selectStage(o.value)}
              className="text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-60"
              style={{
                borderColor: active ? "var(--gold)" : "var(--glass-border-subtle)",
                background: active ? "rgba(201,168,76,0.18)" : "transparent",
                color: active ? "var(--cream)" : "var(--text-on-glass-muted)",
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.6rem",
                letterSpacing: "0.08em",
              }}
            >
              {isPending ? "…" : o.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "#e57373", fontFamily: "var(--font-eb-garamond)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
