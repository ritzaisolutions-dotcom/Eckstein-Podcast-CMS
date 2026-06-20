"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/links", label: "Links", icon: "⛓" },
  { href: "/thumbnail", label: "Thumbnail", icon: "◧" },
] as const;

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  const className = [
    "flex items-center gap-3 px-3 py-2 rounded-sm text-sm w-full",
    active ? "cms-glass-nav-active" : "cms-glass-nav-item",
  ].join(" ");

  const inner = (
    <>
      <span style={{ color: active ? "var(--gold-light)" : "rgba(245,238,216,0.35)", fontSize: "0.8rem" }}>
        {icon}
      </span>
      <span className={active ? "font-medium" : ""} style={{ color: active ? "var(--cream)" : undefined }}>
        {label}
      </span>
    </>
  );

  if (active) {
    return (
      <span className={className} style={{ fontFamily: "var(--font-eb-garamond)" }}>
        {inner}
      </span>
    );
  }

  return (
    <Link href={href} className={className} style={{ fontFamily: "var(--font-eb-garamond)" }}>
      {inner}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <aside className="cms-glass hidden md:flex flex-col w-56 shrink-0 h-dvh sticky top-0 border-r border-[var(--glass-border-subtle)] rounded-none">
        <div className="px-4 py-4 border-b border-[var(--glass-border-subtle)]">
          <Link href="/links" className="flex items-center gap-2.5">
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <polygon points="50,4 96,50 50,96 4,50" stroke="#c9a84c" strokeWidth="4" fill="rgba(245,238,216,0.12)"/>
              <polygon points="50,18 82,50 50,82 18,50" fill="#05101f"/>
              <line x1="38" y1="36" x2="38" y2="64" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt"/>
              <line x1="38" y1="36" x2="63" y2="36" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt"/>
              <line x1="38" y1="50" x2="60" y2="50" stroke="#c9a84c" strokeWidth="4" strokeLinecap="butt"/>
              <line x1="38" y1="64" x2="63" y2="64" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt"/>
            </svg>
            <div>
              <div className="text-sm tracking-[0.12em] uppercase leading-none" style={{ fontFamily: "var(--font-cinzel)", color: "var(--cream)" }}>
                Eckstein
              </div>
              <div className="text-xs mt-0.5 leading-none" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
                Studio
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </nav>

        <div className="px-2 pb-2 border-t border-[var(--glass-border-subtle)] pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm w-full text-left cms-glass-nav-item"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            <span style={{ fontSize: "0.8rem", color: "rgba(245,238,216,0.3)" }}>↩</span>
            <span style={{ color: "rgba(245,238,216,0.4)" }}>Logout</span>
          </button>
        </div>
      </aside>

      <nav className="cms-glass-strong md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-1 border-t border-[var(--glass-border-subtle)] rounded-none">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-all"
            style={{ color: pathname.startsWith(item.href) ? "var(--gold-light)" : "var(--text-on-glass-muted)" }}
          >
            <span style={{ fontSize: "1rem" }}>{item.icon}</span>
            <span className="text-xs" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", letterSpacing: "0.05em" }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
