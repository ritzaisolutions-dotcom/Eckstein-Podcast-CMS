import ContentCard from "./ContentCard";
import type { HubPiece } from "@/lib/content-hub";
import { LIFECYCLE_STAGES, lifecycleLabel, buildContentDetailUrl } from "@/lib/content-hub";

interface ContentBoardProps {
  pieces: HubPiece[];
  returnTo?: string;
}

export default function ContentBoard({ pieces, returnTo }: ContentBoardProps) {
  const byStage: Record<string, HubPiece[]> = {};
  for (const stage of LIFECYCLE_STAGES) byStage[stage] = [];
  for (const piece of pieces) {
    const stage = LIFECYCLE_STAGES.includes(piece.lifecycleStage as (typeof LIFECYCLE_STAGES)[number])
      ? piece.lifecycleStage
      : "draft";
    byStage[stage].push(piece);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {LIFECYCLE_STAGES.map(stage => {
        const columnPieces = byStage[stage];
        return (
          <div key={stage} className="cms-glass-column flex flex-col gap-2 p-3 min-w-[220px] w-[220px] shrink-0">
            <div className="flex items-center justify-between px-0.5 mb-1">
              <span className="cms-glass-title">{lifecycleLabel(stage)}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: columnPieces.length > 0 ? "rgba(201,168,76,0.15)" : "rgba(245,238,216,0.05)",
                  color: columnPieces.length > 0 ? "var(--gold-light)" : "var(--text-on-glass-muted)",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.55rem",
                }}
              >
                {columnPieces.length}
              </span>
            </div>
            {columnPieces.length === 0 ? (
              <p className="text-xs px-1 py-4 text-center" style={{ color: "var(--text-on-glass-muted)", fontStyle: "italic", fontFamily: "var(--font-eb-garamond)" }}>
                —
              </p>
            ) : (
              columnPieces.map(piece => (
                <ContentCard key={piece.id} piece={piece} href={buildContentDetailUrl(piece.id, returnTo)} />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
