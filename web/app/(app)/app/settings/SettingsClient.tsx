"use client";

import { useState } from "react";
import { expressUpgradeInterest } from "@/lib/store";

interface SettingsClientProps {
  tier: string;
  messagesUsed: number;
  messageLimit: number;
  hasExpressedInterest: boolean;
  email: string;
}

export function SettingsClient({
  tier,
  messagesUsed,
  messageLimit,
  hasExpressedInterest,
  email,
}: SettingsClientProps) {
  const [interested, setInterested] = useState(hasExpressedInterest);
  const [isLoading, setIsLoading] = useState(false);

  function handleInterest() {
    expressUpgradeInterest();
    setInterested(true);
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>Account</h2>
        <div className="settings-row">
          <span className="settings-label">Email</span>
          <span className="settings-value">{email}</span>
        </div>
      </div>

      <div className="settings-section">
        <h2>Plan</h2>
        <div className="settings-plan-card">
          <div className="settings-plan-info">
            <span className="settings-plan-badge badge-free">Free</span>
            <p>
              {messagesUsed}/{messageLimit} messages used this month.
            </p>
          </div>

          <div className="settings-plan-upgrade">
            {interested ? (
              <div className="settings-interest-confirmed">
                <span className="settings-interest-check">&#10003;</span>
                <p>
                  You&apos;re on the waitlist for Pro. We&apos;ll email you at{" "}
                  <strong>{email}</strong> when it&apos;s ready.
                </p>
              </div>
            ) : (
              <>
                <p className="settings-upgrade-pitch">
                  Pro is coming soon — unlimited messages, all 5 guided
                  missions, and your assistant gets smarter over time. Join the
                  waitlist to lock in early access pricing.
                </p>
                <button
                  className="settings-upgrade-btn"
                  onClick={handleInterest}
                  disabled={isLoading}
                >
                  {isLoading ? "Joining..." : "Join the Pro waitlist"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Usage</h2>
        <div className="settings-usage-bar">
          <div
            className="settings-usage-fill"
            style={{
              width: `${Math.min((messagesUsed / messageLimit) * 100, 100)}%`,
            }}
          />
        </div>
        <p className="settings-usage-text">
          {messagesUsed} of {messageLimit} free messages used this month
        </p>
      </div>
    </div>
  );
}
