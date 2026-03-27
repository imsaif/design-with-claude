"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkillCard } from "./SkillCard";
import {
  SKILLS,
  CATEGORIES,
  type CategoryId,
} from "@/app/data/skills";

export function SkillsDirectory() {
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">(
    "all"
  );
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? SKILLS
        : SKILLS.filter((s) => s.category === activeCategory),
    [activeCategory]
  );

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

      <div className="skills-grid">
        <AnimatePresence mode="popLayout">
          {filtered.map((skill) => (
            <motion.div
              key={skill.slug}
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
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
