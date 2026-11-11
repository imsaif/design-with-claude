"use client";

import { Fragment, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LearnCTA } from "@/components/skills/LearnCTA";
import { SkillCard } from "./SkillCard";
import {
  SKILLS,
  CATEGORIES,
  STAGES,
  type CategoryId,
  type SkillLevel,
  type StageId,
} from "@/app/data/skills";

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];
// A step with no command yet (Empathy) would filter to an empty grid, so it is left out here.
const STAGE_FILTERS = STAGES.filter((st) => SKILLS.some((s) => s.stage === st.id));

function levelLabel(level: SkillLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function SkillsDirectory() {
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">(
    "all"
  );
  const [activeLevel, setActiveLevel] = useState<SkillLevel | "all">("all");
  const [activeStage, setActiveStage] = useState<StageId | "all">("all");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      SKILLS.filter(
        (s) =>
          (activeCategory === "all" || s.category === activeCategory) &&
          (activeLevel === "all" || s.level === activeLevel) &&
          (activeStage === "all" || s.stage === activeStage)
      ),
    [activeCategory, activeLevel, activeStage]
  );

  const guideAt = Math.min(11, filtered.length);
  const isFiltered = activeCategory !== "all" || activeLevel !== "all" || activeStage !== "all";
  const clearFilters = () => {
    setActiveCategory("all");
    setActiveLevel("all");
    setActiveStage("all");
  };

  return (
    <>
      <div className="skills-filter">
        <div className="skills-filter-pills">
          <button
            className={`skills-filter-pill ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`skills-filter-pill ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="skills-filter-tools">
          <label className={`skills-filter-select ${activeLevel !== "all" ? "active" : ""}`}>
            <span className="sr-only">Level</span>
            <select
              value={activeLevel}
              onChange={(e) => setActiveLevel(e.target.value as SkillLevel | "all")}
            >
              <option value="all">Any level</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {levelLabel(level)}
                </option>
              ))}
            </select>
          </label>
          <label className={`skills-filter-select ${activeStage !== "all" ? "active" : ""}`}>
            <span className="sr-only">Build step</span>
            <select
              value={activeStage}
              onChange={(e) => setActiveStage(e.target.value as StageId | "all")}
            >
              <option value="all">Any step</option>
              {STAGE_FILTERS.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label} (AI {stage.ai})
                </option>
              ))}
            </select>
          </label>
          <span className="skills-filter-count" aria-live="polite">
            {filtered.length} skill{filtered.length !== 1 ? "s" : ""}
          </span>
          {isFiltered && (
            <button type="button" className="skills-filter-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Roughly a third of the way down a full, unfiltered grid. Falls to the
          end when a filter leaves fewer cards than that. */}
      <div className="skills-grid">
        <AnimatePresence mode="popLayout">
          {filtered.map((skill, index) => (
            <Fragment key={skill.slug}>
              {index === guideAt && <LearnCTA />}
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SkillCard
                  skill={skill}
                  isExpanded={expandedSlug === skill.slug}
                  onToggle={() =>
                    setExpandedSlug(
                      expandedSlug === skill.slug ? null : skill.slug
                    )
                  }
                />
              </motion.div>
            </Fragment>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="skills-filter-empty">
            No skills match all three filters.{" "}
            <button type="button" className="skills-filter-clear" onClick={clearFilters}>
              Clear filters
            </button>
          </p>
        )}
        {filtered.length > 0 && guideAt >= filtered.length && <LearnCTA />}
      </div>
    </>
  );
}
