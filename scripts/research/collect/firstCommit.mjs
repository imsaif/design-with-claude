// First-commit date of a config file within a repo — the adoption-curve input.
// Network. Uses the config-file's OWN first commit, NOT repo creation date
// (study #2 method doc §4: repo-creation date is invalid — it back-dates
// recently-added config files and inflates old quarters).
//
// GitHub returns commits newest-first, so the oldest (== first) commit touching
// the path is the last element after paginating. Capped at MAX_PAGES to bound
// cost on long-lived files; a truncated history still yields a valid *upper
// bound* on the first-commit date, which the caller may flag.

const MAX_PAGES = 10; // 100 commits/page * 10 = 1,000 commits max per file

export function firstCommitDate(repo, path, gh) {
  if (!path) return null; // directory-based fingerprints have no single path
  try {
    const out = gh([
      "api", "--paginate", "-X", "GET", `repos/${repo}/commits`,
      "-f", `path=${path}`, "-f", "per_page=100",
      "--jq", ".[].commit.committer.date",
    ]);
    const dates = out.trim().split("\n").filter(Boolean);
    if (dates.length === 0) return null;
    return dates[dates.length - 1]; // oldest == first
  } catch {
    return null; // deleted default branch / empty repo / rate limit — skip row
  }
}

export { MAX_PAGES };
