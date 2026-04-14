"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChipSelector } from "./ChipSelector";
import { saveMemory, createConversation, setActiveConversation, addMessage } from "@/lib/store";
import { generateClaudeMd } from "@/lib/claude-md-generator";

interface OnboardingStep {
  id: string;
  question: string;
  type: "text" | "chips" | "chips-single";
  options?: string[];
  allowOther?: boolean;
  field: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: "product",
    question:
      "What are you building? Tell me about your project — what it does, who it's for, and where you are with it.",
    type: "text",
    field: "product_description",
  },
  {
    id: "design_tools",
    question: "What design tools do you use?",
    type: "chips",
    options: ["Figma", "Sketch", "Adobe XD", "Canva", "Framer", "Pen & Paper"],
    allowOther: true,
    field: "design_tools",
  },
  {
    id: "design_system",
    question: "Do you have a design system or CSS framework?",
    type: "chips-single",
    options: [
      "Tailwind CSS",
      "Material UI",
      "Chakra UI",
      "shadcn/ui",
      "Custom design system",
      "None yet",
    ],
    allowOther: true,
    field: "design_system",
  },
  {
    id: "tech_stack",
    question: "What's your tech stack? Pick everything that applies.",
    type: "chips",
    options: [
      "Next.js",
      "React",
      "Vue",
      "Svelte",
      "HTML/CSS",
      "TypeScript",
      "Node.js",
      "Python",
      "Supabase",
      "Firebase",
    ],
    allowOther: true,
    field: "tech_stack",
  },
  {
    id: "experience",
    question: "How would you describe your experience with code?",
    type: "chips-single",
    options: [
      "Beginner — I'm just getting started",
      "Intermediate — I can build things but get stuck on harder stuff",
      "Advanced — I'm comfortable but want design guidance",
    ],
    field: "experience_level",
  },
];

const EXPERIENCE_MAP: Record<string, string> = {
  "Beginner — I'm just getting started": "beginner",
  "Intermediate — I can build things but get stuck on harder stuff": "intermediate",
  "Advanced — I'm comfortable but want design guidance": "advanced",
};

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function OnboardingChat({ designerName }: { designerName: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hey ${designerName}! I'm your design assistant. Let me learn a bit about you so I can help you build. This takes about 2 minutes.`,
    },
    {
      role: "assistant",
      content: STEPS[0].question,
    },
  ]);
  const [textInput, setTextInput] = useState("");
  const [chipSelection, setChipSelection] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const step = STEPS[currentStep];

  function handleTextSubmit() {
    const trimmed = textInput.trim();
    if (!trimmed) return;
    submitAnswer(trimmed);
    setTextInput("");
  }

  function handleChipConfirm() {
    if (chipSelection.length === 0) return;
    submitAnswer(chipSelection);
    setChipSelection([]);
  }

  async function submitAnswer(answer: string | string[]) {
    // Add user message
    const displayText = Array.isArray(answer) ? answer.join(", ") : answer;
    setMessages((prev) => [...prev, { role: "user", content: displayText }]);

    // Store answer
    const newAnswers = { ...answers, [step.field]: answer };
    setAnswers(newAnswers);

    const nextStep = currentStep + 1;

    if (nextStep < STEPS.length) {
      // Move to next question
      setCurrentStep(nextStep);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: STEPS[nextStep].question },
        ]);
      }, 400);
    } else {
      // All questions answered — submit
      setIsSubmitting(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Got it. Setting up your personal design assistant...",
        },
      ]);

      try {
        const designSystem = Array.isArray(newAnswers.design_system)
          ? (newAnswers.design_system as string[])[0]
          : (newAnswers.design_system as string);
        const experienceLevel = EXPERIENCE_MAP[
          Array.isArray(newAnswers.experience_level)
            ? (newAnswers.experience_level as string[])[0]
            : (newAnswers.experience_level as string)
        ] || "beginner";

        const ctx = {
          product_description: newAnswers.product_description as string,
          design_tools: (newAnswers.design_tools as string[]) || [],
          design_system: designSystem || "None yet",
          tech_stack: (newAnswers.tech_stack as string[]) || [],
          experience_level: experienceLevel,
        };

        // Infer product type
        const descLower = ctx.product_description.toLowerCase();
        let productType = "web-app";
        if (descLower.includes("saas") || descLower.includes("subscription")) productType = "saas";
        else if (descLower.includes("ecommerce") || descLower.includes("shop")) productType = "ecommerce";
        else if (descLower.includes("portfolio") || descLower.includes("personal")) productType = "portfolio";
        else if (descLower.includes("mobile") || descLower.includes("app")) productType = "mobile-app";
        else if (descLower.includes("dashboard") || descLower.includes("admin")) productType = "dashboard";

        const claudeMd = generateClaudeMd(ctx);

        const memory = {
          product_type: productType,
          product_description: ctx.product_description,
          design_tools: ctx.design_tools,
          design_system: ctx.design_system,
          tech_stack: ctx.tech_stack,
          experience_level: ctx.experience_level,
          project_status: "building",
          tone_preference: ctx.experience_level === "beginner" ? "detailed" : "concise",
          custom_context: "",
          claude_md_content: claudeMd,
        };
        saveMemory(memory);

        // Build a personalized welcome that reflects what they told us
        const toolsList = ctx.design_tools.length > 0 ? ctx.design_tools.join(" and ") : "your design tools";
        const stackList = ctx.tech_stack.length > 0 ? ctx.tech_stack.join(", ") : "your stack";
        const welcomeMsg = `Here's what I know about you:

**Your project:** ${ctx.product_description}

**Design tools:** ${toolsList}
**Design system:** ${ctx.design_system}
**Tech stack:** ${stackList}
**Experience:** ${ctx.experience_level}

I'll remember all of this across our conversations. You can ask me about design decisions, get help with technical walls, or start a guided mission.

What would you like to work on first?`;

        // Seed the first conversation with this welcome
        const conv = createConversation("Getting started");
        setActiveConversation(conv.id);
        addMessage(conv.id, {
          id: `msg-welcome-${Date.now()}`,
          role: "assistant",
          content: welcomeMsg,
          created_at: new Date().toISOString(),
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Perfect — let's go." },
        ]);

        setTimeout(() => router.push("/app"), 1200);
      } catch {
        setIsSubmitting(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Something went wrong saving your profile. Please try again.",
          },
        ]);
      }
    }
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`onboarding-progress-dot ${
              i < currentStep ? "done" : i === currentStep ? "active" : ""
            }`}
          />
        ))}
      </div>

      <div className="onboarding-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${
              msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
            }`}
          >
            <div className="chat-bubble-content">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!isSubmitting && (
        <div className="onboarding-input-area">
          {step.type === "text" && (
            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                  placeholder="Tell me about your project..."
                  rows={2}
                  className="chat-input"
                  autoFocus
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="chat-send-btn"
                  aria-label="Send"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {(step.type === "chips" || step.type === "chips-single") && (
            <div className="onboarding-chips-area">
              <ChipSelector
                options={step.options || []}
                selected={chipSelection}
                onChange={setChipSelection}
                allowOther={step.allowOther}
                multiSelect={step.type === "chips"}
              />
              {step.type === "chips" && (
                <button
                  className="onboarding-confirm-btn"
                  onClick={handleChipConfirm}
                  disabled={chipSelection.length === 0}
                >
                  Continue
                </button>
              )}
              {step.type === "chips-single" && chipSelection.length > 0 && (
                <button
                  className="onboarding-confirm-btn"
                  onClick={handleChipConfirm}
                >
                  Continue
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
