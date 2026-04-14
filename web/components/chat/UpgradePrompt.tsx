"use client";

import { useState } from "react";
import Link from "next/link";
import { expressUpgradeInterest } from "@/lib/store";

export function UpgradePrompt() {
  const [joined, setJoined] = useState(false);

  function handleJoin() {
    expressUpgradeInterest();
    setJoined(true);
  }

  if (joined) {
    return (
      <div className="upgrade-prompt">
        <p>
          You&apos;re on the Pro waitlist. We&apos;ll let you know when
          unlimited access is available.
        </p>
      </div>
    );
  }

  return (
    <div className="upgrade-prompt">
      <p>
        You&apos;ve used all 3 free messages this month. Pro with unlimited
        access is coming soon.
      </p>
      <div className="upgrade-prompt-actions">
        <button className="upgrade-prompt-btn" onClick={handleJoin}>
          Join the Pro waitlist
        </button>
        <Link href="/app/settings" className="upgrade-prompt-link">
          View usage
        </Link>
      </div>
    </div>
  );
}
