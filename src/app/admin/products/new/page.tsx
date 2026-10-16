import { redirect } from "next/navigation";

export default function LegacyAdminNewProductRedirect() {
  redirect("/admin-portal/products/new");
}
