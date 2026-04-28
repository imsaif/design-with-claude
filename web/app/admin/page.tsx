import { checkAdminAuth } from "@/lib/admin-auth";
import SignupsClient from "./signups-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuthenticated = await checkAdminAuth();
  return <SignupsClient initialAuth={isAuthenticated} />;
}
