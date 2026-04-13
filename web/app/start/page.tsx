import { Shell } from "@/components/companion/Shell";
import { StartWizard } from "@/components/companion/StartWizard";

export const metadata = {
  title: "Start — designwithclaude",
};

export default function StartPage() {
  return (
    <Shell step={1}>
      <StartWizard />
    </Shell>
  );
}
