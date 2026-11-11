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
        <span className="skills-filter-count">
          {filtered.length} skill{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="skills-filter">
        <div className="skills-filter-pills">
          <button
            className={`skills-filter-pill ${activeLevel === "all" ? "active" : ""}`}
            onClick={() => setActiveLevel("all")}
          >
            All levels
          </button>
          {LEVELS.map((level) => (
            <button
              key={level}
              className={`skills-filter-pill ${activeLevel === level ? "active" : ""}`}
              onClick={() => setActiveLevel(level)}
            >
              {levelLabel(level)}
            </button>
          ))}
        </div>
      </div>

      <div className="skills-filter">
        <div className="skills-filter-pills">
          <button
            className={`skills-filter-pill ${activeStage === "all" ? "active" : ""}`}
            onClick={() => setActiveStage("all")}
          >
            All steps
          </button>
          {STAGE_FILTERS.map((stage) => (
            <button
              key={stage.id}
              className={`skills-filter-pill ${activeStage === stage.id ? "active" : ""}`}
              onClick={() => setActiveStage(stage.id)}
            >
              {stage.label} · AI {stage.ai}
            </button>
          ))}
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
        {guideAt >= filtered.length && <LearnCTA />}
      </div>
    </>
  );
}
