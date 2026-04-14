"use client";

interface MissionBannerProps {
  missionTitle: string;
  stepTitle: string;
  currentStep: number;
  totalSteps: number;
}

export function MissionBanner({
  missionTitle,
  stepTitle,
  currentStep,
  totalSteps,
}: MissionBannerProps) {
  return (
    <div className="mission-banner">
      <div className="mission-banner-info">
        <span className="mission-banner-title">{missionTitle}</span>
        <span className="mission-banner-step">
          Step {currentStep + 1}/{totalSteps}: {stepTitle}
        </span>
      </div>
    </div>
  );
}
