import { checkAdminAuth } from "@/lib/admin-auth";
import EventsClient from "./events-client";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const isAuthenticated = await checkAdminAuth();
  return <EventsClient initialAuth={isAuthenticated} />;
}
