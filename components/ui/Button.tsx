import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const VARIANTS = {
  primary: {
    background: "var(--navy)",
    color: "var(--cream)",
    border: "transparent",
    hoverBg: "var(--gold)",
    hoverColor: "var(--navy)",
  },
  secondary: {
    background: "var(--bg-surface)",
    color: "var(--navy)",
    border: "var(--navy-3)",
    hoverBg: "var(--bg-surface-2)",
    hoverColor: "var(--navy)",
  },
  ghost: {
    background: "transparent",
    color: "var(--navy)",
    border: "transparent",
    hoverBg: "var(--bg-surface-2)",
    hoverColor: "var(--navy)",
  },
  danger: {
    background: "transparent",
    color: "#c0392b",
    border: "#c0392b",
    hoverBg: "#c0392b",
    hoverColor: "var(--cream)",
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
