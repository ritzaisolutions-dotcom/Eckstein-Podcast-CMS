"use client";

import Link from "next/link";
import { LINK_GROUPS } from "@/lib/links";
import TaskBoard from "@/components/TaskBoard";

function DashboardDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <span
      style={{
        fontFamily: "var(--font-cormorant)",
        fontSize: "1rem",
        fontStyle: "italic",
        color: "var(--text-on-glass-muted)",
      }}
    >
      {formatted}
    </span>
  );
}

export default function Dashboard() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* Masthead */}
      <div className="cms-masthead">
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "1.35rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--cream)",
              fontWeight: 600,
              lineHeight: 1,
              margin: 0,
            }}
          >
            Studio
          </h1>
          <span
            style={{
              fontFamily: "var(--font-eb-garamond)",
              fontSize: "0.8rem",
              fontStyle: "italic",
              color: "var(--gold-light)",
              letterSpacing: "0.04em",
            }}
          >
            Eckstein Podcast
          </span>
        </div>
        <DashboardDate />
      </div>

      <div className="cms-dashboard-grid">
        {/* Left: Platform Grid */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-on-glass-muted)",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Plattformen
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.625rem",
            }}
          >
            {LINK_GROUPS.map(group => (
              <div
                key={group.slug}
                className="cms-platform-card"
                style={{ borderLeftColor: group.color }}
              >
                <div className="cms-platform-title" style={{ color: group.color, opacity: 0.9 }}>
                  {group.title.split(" ")[0]}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {group.links.map(link => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "var(--font-eb-garamond)",
                        fontSize: "0.85rem",
                        color: "var(--text-on-glass-muted)",
                        textDecoration: "none",
                        padding: "0.1rem 0.4rem",
                        border: "1px solid var(--glass-border-subtle)",
                        borderRadius: "2px",
                        transition: "color 0.15s, border-color 0.15s",
                        lineHeight: 1.6,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = "var(--cream)";
                        (e.currentTarget as HTMLElement).style.borderColor = group.color;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = "var(--text-on-glass-muted)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border-subtle)";
                      }}
                    >
                      {link.label} ↗
                    </a>
                  ))}
                  {group.loginUrl && (
                    <a
                      href={group.loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.52rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: group.color,
                        textDecoration: "none",
                        padding: "0.1rem 0.4rem",
                        border: `1px solid ${group.color}40`,
                        borderRadius: "2px",
                        transition: "background 0.15s",
                        lineHeight: 1.6,
                        alignSelf: "center",
                      }}
                    >
                      Login
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tasks + Thumbnail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Task Board */}
          <div className="cms-glass-strong" style={{ padding: "1rem 1.125rem", borderRadius: "4px" }}>
            <TaskBoard />
          </div>

          {/* Thumbnail Shortcut */}
          <Link
            href="/thumbnail"
            className="cms-platform-card"
            style={{
              borderLeftColor: "var(--gold)",
              textDecoration: "none",
              display: "block",
              cursor: "pointer",
            }}
          >
            <div className="cms-platform-title" style={{ color: "var(--gold-light)" }}>
              Thumbnail Generator
            </div>
            <div
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "1rem",
                fontStyle: "italic",
                color: "var(--text-on-glass-muted)",
                marginTop: "0.2rem",
              }}
            >
              1280 × 720 — PNG Export →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
