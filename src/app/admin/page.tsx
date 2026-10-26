import { redirect } from "next/navigation";
import { getStaffRole } from "./actions";
import SovereignAdminOverview from "@/components/Admin/SovereignAdminOverview";

export const revalidate = 0; // Disable static caching

export default async function AdminOverviewPage() {
  const role = await getStaffRole();
  if (!role) {
    redirect("/admin/login");
  }

  return <SovereignAdminOverview role={role} />;
}
