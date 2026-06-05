import Link from "next/link";
import type { HubPiece } from "@/lib/content-hub";
import { TYPE_LABELS } from "@/lib/content-hub";

function dotClass(state: "off" | "scheduled" | "live") {
  if (state === "live") return "cms-dot cms-dot-live";
  if (state === "scheduled") return "cms-dot cms-dot-scheduled";
  return "cms-dot cms-dot-off";
}

interface ContentCardProps {
  piece: HubPiece;
  href?: string;
}

export default function ContentCard({ piece, href }: ContentCardProps) {
  const linkHref = href ?? `/content/${piece.id}`;

  return (
    <Link href={linkHref} className="block">
      <article className="cms-glass-strong cms-glass-hover p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {piece.episodeNumber != null && (
              <span
                className="shrink-0 text-xs"
                style={{ fontFamily: "var(--font-cinzel)", color: "var(--gold-light)", fontSize: "0.65rem" }}
              >
                EP.{piece.episodeNumber}
              </span>
            )}
            <span
              className="shrink-0 text-xs px-1.5 py-0.5 rounded"
              style={{ background: "rgba(201,168,76,0.12)", color: "var(--gold-pale)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}
            >
              {TYPE_LABELS[piece.type] ?? piece.type}
            </span>
          </div>
        </div>
        <h3
          className="text-sm leading-snug mb-2 line-clamp-2"
          style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass)" }}
        >
          {piece.title}
        </h3>
        {piece.platformDots.length > 0 && (
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {piece.platformDots.map(p => (
              <div key={p.slug} className="flex items-center gap-1" title={p.slug}>
                <span className={dotClass(p.state)} />
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.48rem", color: "var(--text-on-glass-muted)", letterSpacing: "0.06em" }}>
                  {p.shortLabel}
                </span>
              </div>
            ))}
          </div>
        )}
        {piece.scheduleLabel && (
          <p className="text-xs mt-1" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
            {piece.scheduleLabel}
          </p>
        )}
      </article>
    </Link>
  );
}
