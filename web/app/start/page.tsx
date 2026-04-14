import { Shell } from "@/components/companion/Shell";
import { StartWizard } from "@/components/companion/StartWizard";
import { isTokenShapeValid } from "@/lib/dwc/tokens";
import { isValidSlug } from "@/lib/dwc/projects";

interface StartPageProps {
  searchParams: Promise<{ token?: string; project?: string }>;
}

export const metadata = {
  title: "Start — designwithclaude",
};

export default async function StartPage({ searchParams }: StartPageProps) {
  const { token, project } = await searchParams;
  const validToken = token && isTokenShapeValid(token) ? token : undefined;
  const validProject = project && isValidSlug(project) ? project : undefined;

  return (
    <Shell step={1} token={validToken}>
      <StartWizard initialToken={validToken} initialProject={validProject} />
    </Shell>
  );
}
