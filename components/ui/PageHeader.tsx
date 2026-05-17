interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
      <div>
        <div className="flex items-baseline gap-3">
          <h1
            className="text-2xl tracking-[0.08em] uppercase"
            style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <span className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
              {subtitle}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm mt-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--text-muted)", fontStyle: "italic", fontSize: "1rem" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
