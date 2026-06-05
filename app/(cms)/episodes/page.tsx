import { redirect } from "next/navigation";

export default async function EpisodesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const p = new URLSearchParams({ type: "lfc" });
  if (params.status) p.set("status", params.status);
  if (params.view === "table") p.set("view", "table");
  redirect(`/content?${p.toString()}`);
}
