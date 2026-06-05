import { redirect } from "next/navigation";

const FORWARD_KEYS = ["view", "status", "page", "q", "sort", "dir", "due"] as const;

export default async function EpisodesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const p = new URLSearchParams({ type: "lfc" });
  for (const key of FORWARD_KEYS) {
    if (params[key]) p.set(key, params[key]!);
  }
  redirect(`/content?${p.toString()}`);
}
