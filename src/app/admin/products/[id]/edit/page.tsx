import { redirect } from "next/navigation";

export default async function LegacyAdminEditProductRedirect(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(`/admin-portal/products/${id}/edit`);
}
