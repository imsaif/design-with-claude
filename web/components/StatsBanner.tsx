"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const stats = [
  { value: 28, label: "Agents", suffix: "" },
  { value: 7, label: "Categories", suffix: "" },
  { value: 100, label: "Commands", suffix: "+" },
  { value: 1, label: "MIT License", suffix: "", isText: true }
];

function AnimatedCounter({ value, suffix, isText }: { value: number; suffix: string; isText?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isText) {
      setCount(value);
      return;
    }

    const timer = setTimeout(() => {
      const increment = value / 30;
      const interval = setInterval(() => {
        setCount(prev => {
          if (prev >= value) {
            clearInterval(interval);
            return value;
          }
          return Math.min(prev + increment, value);
        });
      }, 50);
      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, isText]);

  if (isText) {
    return <span className="font-bold">MIT</span>;
  }

  return (
    <span className="font-bold">
      {Math.floor(count)}{suffix}
    </span>
  );
}

export default function StatsBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="border-b border-white/5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} isText={stat.isText} />
              </div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}