"use client";

import { MISSIONS } from "@/lib/missions/definitions";
import { getMissionProgress } from "@/lib/store";
import { MissionCard } from "@/components/missions/MissionCard";

export default function MissionsPage() {
  const progress = getMissionProgress();
  const progressMap = new Map(progress.map((p) => [p.mission_id, p]));

  return (
    <div className="missions-page">
      <div className="missions-header">
        <h1>Guided Missions</h1>
        <p>
          Step-by-step workflows that walk you through building. Pick a mission
          and your assistant will guide you through each step.
        </p>
      </div>
      <div className="missions-grid">
        {MISSIONS.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            progress={progressMap.get(mission.id) || null}
          />
        ))}
      </div>
    </div>
  );
}
