"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteContentButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "confirm" | "deleting">("idle");
  const [error, setError] = useState("");

  async function handleDelete() {
    setPhase("deleting");
    setError("");
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      router.push("/content");
      router.refresh();
    } catch {
      setError("Löschen fehlgeschlagen — bitte erneut versuchen.");
      setPhase("idle");
    }
  }

  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={() => setPhase("confirm")}
        className="text-xs px-3 py-1.5 rounded border transition-colors"
        style={{
          borderColor: "rgba(192,57,43,0.3)",
          color: "#c0392b",
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.07em",
          background: "transparent",
        }}
      >
        Löschen
      </button>
    );
  }

  if (phase === "confirm") {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-xs max-w-48 truncate"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}
          title={title}
        >
          „{title}" löschen?
        </span>
        <button
          type="button"
          onClick={handleDelete}
          className="text-xs px-3 py-1.5 rounded border"
          style={{
            borderColor: "#c0392b",
            background: "#c0392b",
            color: "#fff",
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.07em",
          }}
        >
          Ja, löschen
        </button>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="text-xs px-3 py-1.5 rounded border"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.07em",
            background: "transparent",
          }}
        >
          Abbrechen
        </button>
        {error && (
          <span className="text-xs" style={{ color: "#c0392b", fontFamily: "var(--font-eb-garamond)" }}>
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.07em" }}>
      Löschen...
    </span>
  );
}
