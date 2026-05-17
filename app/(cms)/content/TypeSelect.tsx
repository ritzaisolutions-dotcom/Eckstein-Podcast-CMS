"use client";

import { useRouter } from "next/navigation";

const TYPE_OPTIONS = [
  { value: "", label: "Alle" },
  { value: "lfc", label: "LFC — Long-Form" },
  { value: "sfc", label: "SFC — Shorts" },
  { value: "article", label: "Artikel" },
  { value: "newsletter", label: "Newsletter" },
  { value: "social_post", label: "Social Posts" },
  { value: "media", label: "Media" },
];

export default function TypeSelect({ current, query, statusFilter }: { current: string; query: string; statusFilter: string }) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams();
    if (e.target.value) p.set("type", e.target.value);
    if (query) p.set("q", query);
    if (statusFilter) p.set("status", statusFilter);
    router.push(`/content?${p.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="cms-input text-sm py-1.5 px-3 pr-8"
      style={{ minWidth: 160, cursor: "pointer" }}
    >
      {TYPE_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
