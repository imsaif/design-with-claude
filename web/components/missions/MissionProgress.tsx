"use client";

interface MissionProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  completed: boolean;
}

export function MissionProgress({
  currentStep,
  totalSteps,
  stepTitles,
  completed,
}: MissionProgressProps) {
  return (
    <div className="mission-progress">
      <div className="mission-progress-dots">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`mission-progress-dot ${
              completed || i < currentStep
                ? "mission-dot-done"
                : i === currentStep
                ? "mission-dot-active"
                : ""
            }`}
            title={stepTitles[i]}
          />
        ))}
      </div>
      {!completed && currentStep < stepTitles.length && (
        <span className="mission-progress-label">{stepTitles[currentStep]}</span>
      )}
    </div>
  );
}
