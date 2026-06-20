import PageHeader from "@/components/ui/PageHeader";
import { LINK_GROUPS } from "@/lib/links";

export default function LinksPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader
        title="Links"
        subtitle="Plattformen & Quick-Links — bis Notion live ist"
      />

      <div className="flex flex-col gap-3">
        {LINK_GROUPS.map(group => (
          <section key={group.slug} className="cms-card">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="cms-card-title mb-0">{group.title}</h2>
              {group.loginUrl && (
                <a
                  href={group.loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs shrink-0 px-3 py-1.5 rounded border transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--gold)",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  Login →
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.links.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1.5 rounded cms-glass-strong transition-colors hover:border-gold"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-eb-garamond)",
                  }}
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
