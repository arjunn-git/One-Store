import { redirect } from "next/navigation";

export default function LegacyAdminInventoryRedirect() {
  redirect("/admin-portal/inventory");
}
