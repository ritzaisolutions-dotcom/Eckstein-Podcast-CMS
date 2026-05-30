import { redirect } from "next/navigation";

export default function PostsPage() {
  redirect("/content?type=social_post");
}
