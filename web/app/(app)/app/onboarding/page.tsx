"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasCompletedOnboarding } from "@/lib/store";
import { OnboardingChat } from "@/components/onboarding/OnboardingChat";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasCompletedOnboarding()) {
      router.push("/app");
    }
  }, [router]);

  return <OnboardingChat designerName="there" />;
}
