import { redirect } from "next/navigation";

export default function ArticlesPage() {
  redirect("/content?type=article");
}
