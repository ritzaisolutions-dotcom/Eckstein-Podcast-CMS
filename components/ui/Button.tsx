import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const VARIANTS = {
  primary: {
    background: "rgba(201,168,76,0.22)",
    color: "var(--cream)",
    border: "rgba(201,168,76,0.45)",
    hoverBg: "rgba(201,168,76,0.35)",
    hoverColor: "var(--cream)",
  },
  secondary: {
    background: "rgba(245,238,216,0.06)",
    color: "var(--cream)",
    border: "var(--glass-border-subtle)",
    hoverBg: "rgba(245,238,216,0.1)",
    hoverColor: "var(--gold-light)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-on-glass-muted)",
    border: "transparent",
    hoverBg: "rgba(245,238,216,0.06)",
    hoverColor: "var(--cream)",
  },
  danger: {
    background: "transparent",
    color: "#e57373",
    border: "rgba(229,115,115,0.45)",
    hoverBg: "rgba(229,115,115,0.15)",
    hoverColor: "#ffcdd2",
  },
};

export default function Button({ variant = "primary", size = "md", children, className, style, ...props }: ButtonProps) {
  const v = VARIANTS[variant];
  const padding = size === "sm" ? "0.3rem 0.75rem" : "0.5rem 1.25rem";
  const fontSize = size === "sm" ? "0.65rem" : "0.7rem";

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded tracking-[0.15em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className ?? ""}`}
      style={{
        background: v.background,
        color: v.color,
        border: `1px solid ${v.border}`,
        padding,
        fontFamily: "var(--font-cinzel)",
        fontWeight: 600,
        fontSize,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
