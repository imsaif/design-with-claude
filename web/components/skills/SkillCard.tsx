"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type Skill,
  getCategoryLabel,
  getInstallCommand,
  getGithubUrl,
} from "@/app/data/skills";
import { SkillIcon } from "./SkillIcons";

interface SkillCardProps {
  skill: Skill;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SkillCard({ skill, isExpanded, onToggle }: SkillCardProps) {
  const [copied, setCopied] = useState(false);
  const installCmd = getInstallCommand(skill.slug);
  const githubUrl = getGithubUrl(skill.slug);

  const handleCopyCommand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(installCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [installCmd]
  );

  return (
    <div
      className={`skill-card ${isExpanded ? "expanded" : ""}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="skill-card-header">
        <div className="skill-card-icon">
          <SkillIcon slug={skill.slug} className="h-5 w-5" />
        </div>
        <span className="skill-card-badge">.md</span>
      </div>
      <div className="skill-card-slug">{skill.slug}</div>
      <div className="skill-card-desc">{skill.description}</div>
      <div className="skill-card-tags">
        <span className="skill-card-tag">
          {getCategoryLabel(skill.category)}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="skill-card-expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {copied && (
              <div className="skill-card-expand-row">
                <span className="skill-card-copied-label">✓ Copied!</span>
              </div>
            )}
            <div
              className={`skill-card-code ${copied ? "copied" : ""}`}
              onClick={handleCopyCommand}
              role="button"
              tabIndex={0}
              aria-label={copied ? "Command copied" : "Copy install command"}
            >
              <div className="skill-card-code-scroll">
                <code>{installCmd}</code>
              </div>
              <span className="skill-card-copy-label">
                {copied ? "Copied" : "Copy"}
              </span>
            </div>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="skill-card-github"
              onClick={(e) => e.stopPropagation()}
            >
              → View on GitHub
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
