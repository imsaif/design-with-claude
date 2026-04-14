"use client";

import { SettingsClient } from "./SettingsClient";
import { getMessageCount, hasExpressedUpgradeInterest } from "@/lib/store";

export default function SettingsPage() {
  const { used, limit } = getMessageCount();

  return (
    <SettingsClient
      tier="free"
      messagesUsed={used}
      messageLimit={limit}
      hasExpressedInterest={hasExpressedUpgradeInterest()}
      email=""
    />
  );
}
