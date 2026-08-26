import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardClient from "@/app/(dashboard)/dashboard/DashboardClient";

export default async function JobSeekerDashboardPreviewPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") redirect("/admin-login");

  return (
    <Suspense fallback={null}>
      <DashboardClient />
    </Suspense>
  );
}
