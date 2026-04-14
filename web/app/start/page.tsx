import { redirect } from "next/navigation";
import { Shell } from "@/components/companion/Shell";
import { StartWizard } from "@/components/companion/StartWizard";
import { WelcomeBackBanner } from "@/components/companion/WelcomeBackBanner";
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

  // Hitting /start with a valid token but no project slug is the "trap" case
  // — the old flow would silently overwrite the designer's default project
  // on submit. Send them to the account dashboard instead, where the "Add
  // project" form deep-links back here with a slug.
  if (validToken && !validProject) {
    redirect(`/account?token=${validToken}`);
  }

  return (
    <Shell step={1} token={validToken}>
      {/* Only show the banner when there's no token in the URL — if there is
          one, the inline "Adding X" callout inside the wizard covers it. */}
      {!validToken ? <WelcomeBackBanner /> : null}
      <StartWizard initialToken={validToken} initialProject={validProject} />
    </Shell>
  );
}
