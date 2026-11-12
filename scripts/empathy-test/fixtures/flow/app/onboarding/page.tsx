"use client";

import { useState } from "react";

// Every new account goes through all five steps before it can send a first invoice.
const STEPS = [
  "Upload your logo",
  "Choose an invoice template",
  "Connect your bank account",
  "Set your default payment terms",
  "Import your client list",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <main>
      <p>Step {step + 1} of {STEPS.length}</p>
      <h1>{STEPS[step]}</h1>
      <button onClick={() => (last ? (window.location.href = "/invoices/new") : setStep(step + 1))}>
        {last ? "Finish setup" : "Next"}
      </button>
    </main>
  );
}
