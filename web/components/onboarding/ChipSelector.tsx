"use client";

import { useState } from "react";

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowOther?: boolean;
  multiSelect?: boolean;
}

export function ChipSelector({
  options,
  selected,
  onChange,
  allowOther = false,
  multiSelect = true,
}: ChipSelectorProps) {
  const [otherValue, setOtherValue] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  function toggle(option: string) {
    if (multiSelect) {
      if (selected.includes(option)) {
        onChange(selected.filter((s) => s !== option));
      } else {
        onChange([...selected, option]);
      }
    } else {
      onChange([option]);
    }
  }

  function addOther() {
    const trimmed = otherValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setOtherValue("");
      setShowOtherInput(false);
    }
  }

  return (
    <div className="chip-selector">
      <div className="chip-group">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`chip ${selected.includes(option) ? "chip-selected" : ""}`}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
        {allowOther && !showOtherInput && (
          <button
            type="button"
            className="chip chip-other"
            onClick={() => setShowOtherInput(true)}
          >
            + Other
          </button>
        )}
      </div>
      {showOtherInput && (
        <div className="chip-other-input">
          <input
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOther()}
            placeholder="Type and press Enter"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
