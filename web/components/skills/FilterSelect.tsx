"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterSelectProps<T extends string> {
  label: string; // accessible name, e.g. "Level"
  value: T;
  options: FilterOption<T>[]; // the first option is the "any" choice
  onChange: (value: T) => void;
}

// A pill-shaped dropdown that matches the category pills, replacing the browser's native menu.
// Listbox pattern: Up/Down/Home/End move, Enter/Space pick, Escape or a click outside closes.
export function FilterSelect<T extends string>({ label, value, options, onChange }: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const isSet = selectedIndex !== 0;

  useEffect(() => {
    if (!open) return;
    setActive(selectedIndex);
    listRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, selectedIndex]);

  const pick = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") buttonRef.current?.focus();
    }
  };

  return (
    <div className="filter-select" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`skills-filter-pill filter-select-button ${isSet ? "active" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${options[selectedIndex].label}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {options[selectedIndex].label}
        <svg className="filter-select-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          className="filter-select-menu"
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              className={`filter-select-option ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(i)}
            >
              <span>{o.label}</span>
              {i === selectedIndex && (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2.5 6.5 5 9l4.5-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
