import { redirect } from "next/navigation";

// Analytics was replaced by the Categories overview, now the admin home.
export default function Page() {
  redirect("/admin/dashboard/categories");
}
