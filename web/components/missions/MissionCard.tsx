"use client";

import { useState } from "react";
import type { MissionDefinition } from "@/lib/missions/definitions";
import { MissionProgress } from "./MissionProgress";
import {
  createConversation,
  setActiveConversation,
  saveMissionProgress,
  type MissionProgressData,
} from "@/lib/store";

interface MissionCardProps {
  mission: MissionDefinition;
  progress: MissionProgressData | null;
}

const ICONS: Record<string, string> = {
  rocket: "\u{1F680}",
  layout: "\u{1F4D0}",
  lock: "\u{1F512}",
  sparkles: "\u{2728}",
  "check-circle": "\u{2705}",
};

export function MissionCard({ mission, progress }: MissionCardProps) {
  const [isStarting, setIsStarting] = useState(false);

  const status = progress?.status || "not_started";
  const currentStep = progress?.current_step || 0;

  function handleStart() {
    setIsStarting(true);
    const conv = createConversation(`Mission: ${mission.title}`, mission.id);
    setActiveConversation(conv.id);
    saveMissionProgress({
      mission_id: mission.id,
      status: "in_progress",
      current_step: 0,
      total_steps: mission.totalSteps,
      completed_steps: [],
      conversation_id: conv.id,
    });
    window.location.href = "/app";
  }

  function handleContinue() {
    if (progress?.conversation_id) {
      setActiveConversation(progress.conversation_id);
      window.location.href = "/app";
    }
  }

  return (
    <div className={`mission-card ${status === "completed" ? "mission-card-completed" : ""}`}>
      <div className="mission-card-icon">{ICONS[mission.icon] || "\u{1F3AF}"}</div>
      <h3 className="mission-card-title">{mission.title}</h3>
      <p className="mission-card-desc">{mission.description}</p>

      {status !== "not_started" && (
        <MissionProgress
          currentStep={currentStep}
          totalSteps={mission.totalSteps}
          stepTitles={mission.steps.map((s) => s.title)}
          completed={status === "completed"}
        />
      )}

      <div className="mission-card-footer">
        {status === "not_started" && (
          <button
            className="mission-card-btn"
            onClick={handleStart}
            disabled={isStarting}
          >
            {isStarting ? "Starting..." : "Start mission"}
          </button>
        )}
        {status === "in_progress" && (
          <button className="mission-card-btn" onClick={handleContinue}>
            Continue (Step {currentStep + 1}/{mission.totalSteps})
          </button>
        )}
        {status === "completed" && (
          <span className="mission-card-complete-label">Completed</span>
        )}
      </div>
    </div>
  );
}
