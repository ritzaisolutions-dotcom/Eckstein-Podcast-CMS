import { redirect } from "next/navigation";

export default function NewsletterPage() {
  redirect("/content?type=article");
}
