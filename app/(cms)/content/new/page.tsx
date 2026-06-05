export const dynamic = "force-dynamic";

import ContentQuickCreate from "@/components/content/ContentQuickCreate";
import { buildContentHubUrl } from "@/lib/content-hub";
import { isContentType } from "@/lib/platforms";

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const type = params.type && isContentType(params.type) ? params.type : undefined;
  const backHref = buildContentHubUrl({ type: type ?? "" });

  return <ContentQuickCreate defaultType={type} backHref={backHref} />;
}
