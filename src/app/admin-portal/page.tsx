import { redirect } from "next/navigation";
import { verifyAdminRequest } from "@/lib/services/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPortalIndex() {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) {
    redirect("/admin-portal/login");
  }
  redirect("/admin-portal/dashboard");
}
