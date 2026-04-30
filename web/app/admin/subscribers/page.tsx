import { checkAdminAuth } from "@/lib/admin-auth";
import SubscribersClient from "./subscribers-client";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const isAuthenticated = await checkAdminAuth();
  return <SubscribersClient initialAuth={isAuthenticated} />;
}
