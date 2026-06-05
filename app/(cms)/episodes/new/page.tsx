import { redirect } from "next/navigation";

export default async function NewEpisodeRedirect({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const qs = params.type ? `?type=${params.type}` : "";
  redirect(`/content/new${qs}`);
}
