"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const NAV_MAIN: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "◈" },
  { href: "/content", label: "Content", icon: "▤" },
  { href: "/analytics", label: "Analytics", icon: "◎" },
  { href: "/prep", label: "Episode Prep", icon: "◉" },
  { href: "/newsletter", label: "Das Fundament", icon: "✦" },
  { href: "/mind-dump", label: "Ideen & Topics", icon: "⊕" },
];

const NAV_BOTTOM: NavItem[] = [
  { href: "/media", label: "Media Library", icon: "◫" },
  { href: "/guests", label: "Gäste", icon: "◎" },
  { href: "/vault", label: "Vault", icon: "⬘" },
  { href: "/settings", label: "Einstellungen", icon: "◌" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const inner = (
    <>
      <span style={{ color: active ? "var(--gold)" : "rgba(12,30,53,0.4)", fontSize: "0.8rem" }}>
        {item.icon}
      </span>
      <span className={active ? "font-medium" : ""}>{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: "var(--gold)", color: "var(--navy)", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem" }}
        >
          {item.badge}
        </span>
      )}
    </>
  );

  const sharedStyle = {
    background: active ? "rgba(201,168,76,0.12)" : "transparent",
    color: active ? "var(--navy)" : "var(--text-secondary)",
    fontFamily: "var(--font-eb-garamond)",
    borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
  };

  if (active) {
    return (
      <span className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm" style={sharedStyle}>
        {inner}
      </span>
    );
  }

  return (
    <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-sm transition-all text-sm" style={sharedStyle}>
      {inner}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 h-dvh sticky top-0 border-r"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <polygon points="50,4 96,50 50,96 4,50" stroke="#c9a84c" strokeWidth="4" fill="#f5eed8"/>
              <polygon points="50,18 82,50 50,82 18,50" fill="#05101f"/>
              <line x1="38" y1="36" x2="38" y2="64" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt"/>
              <line x1="38" y1="36" x2="63" y2="36" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt"/>
              <line x1="38" y1="50" x2="60" y2="50" stroke="#c9a84c" strokeWidth="4" strokeLinecap="butt"/>
              <line x1="38" y1="64" x2="63" y2="64" stroke="#c9a84c" strokeWidth="5" strokeLinecap="butt"/>
            </svg>
            <div>
              <div
                className="text-sm tracking-[0.12em] uppercase leading-none"
                style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}
              >
                Eckstein
              </div>
              <div
                className="text-xs mt-0.5 leading-none"
                style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}
              >
                Studio
              </div>
            </div>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
          {NAV_MAIN.map(item => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        {/* Divider + Bottom nav */}
        <div className="px-2 pb-2 flex flex-col gap-0.5 border-t pt-2" style={{ borderColor: "var(--border)" }}>
          {NAV_BOTTOM.map(item => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-sm transition-all text-sm w-full text-left mt-1"
            style={{
              color: "rgba(12,30,53,0.35)",
              fontFamily: "var(--font-eb-garamond)",
              borderLeft: "3px solid transparent",
            }}
          >
            <span style={{ fontSize: "0.8rem" }}>↩</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-1 border-t"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {[NAV_MAIN[0], NAV_MAIN[1], NAV_MAIN[2], NAV_MAIN[3], NAV_BOTTOM[0]].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-all"
            style={{ color: isActive(item.href) ? "var(--gold)" : "var(--text-muted)" }}
          >
            <span style={{ fontSize: "1rem" }}>{item.icon}</span>
            <span className="text-xs" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", letterSpacing: "0.05em" }}>
              {item.label.split(" ")[0]}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
