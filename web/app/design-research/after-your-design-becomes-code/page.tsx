import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../research.module.css";
import d from "./drift.module.css";

const SITE_URL = "https://www.designwithclaude.com";
const PAGE_PATH = "/design-research/after-your-design-becomes-code";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "After your design becomes code";
const PAGE_DESCRIPTION =
  "Claude Design now lives in Claude, one step from Claude Code, and Anthropic has solved the handoff between them. What nobody has solved is what happens after it: the small changes that each skip the design system, and how to keep a design intact in the repo.";
const DATE_PUBLISHED = "2026-11-13";

const MOVE_URL = "https://support.claude.com/en/articles/17440474-move-from-standalone-claude-design-to-claude";
const START_URL = "https://support.claude.com/en/articles/14604416-get-started-with-claude-design";
const INTRO_URL = "https://www.anthropic.com/news/claude-design-anthropic-labs";

export const metadata = {
  title: `${PAGE_TITLE} · Design Research · designwithclaude`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: `${PAGE_TITLE} · designwithclaude`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "article",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  author: { "@type": "Person", name: "Imran Mohammed" },
  publisher: { "@type": "Organization", name: "designwithclaude" },
  datePublished: DATE_PUBLISHED,
  dateModified: DATE_PUBLISHED,
  isPartOf: { "@type": "CreativeWorkSeries", name: "Design Research", url: `${SITE_URL}/design-research` },
  url: PAGE_URL,
};

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const WHICH = [
  { task: "Exploring directions", design: "Canvas, tweaks and side-by-side variations", code: "Possible, but slower without a canvas", wins: "design" },
  { task: "Pointing at an element", design: "Comment on it directly", code: "Describe it, or name the file", wins: "design" },
  { task: "Decks and one-pagers", design: "Built for it", code: "Not its strength", wins: "design" },
  { task: "A prototype that really works", design: "A clickable mock", code: "Real code, live on a URL", wins: "code" },
  { task: "Decisions that last", design: "Kept per project", code: "Written into the repo, read every session", wins: "code" },
  { task: "What actually ships", design: "Not its job", code: "It is the thing that ships", wins: "code" },
];

const CHANGES = [
  { pin: "1", when: "Week 2 · “Make the button pop.”", what: "A hand-written orange replaces the brand colour. White text on it now reads at 2.85:1, below the 4.5:1 that WCAG asks for." },
  { pin: "2", when: "Week 4 · A new session adds a shadow.", what: "The flat cards were a decision, but it was never written down, so the next session couldn’t know." },
  { pin: "3", when: "Week 6 · “Make the caption quieter.”", what: "The grey goes from 7.58:1 to 2.39:1. It looked fine on a bright screen." },
  { pin: "4", when: "Week 8 · A quick fix for alignment.", what: "Padding set to 13px by hand, off the spacing scale, so this card no longer lines up with the ones beside it." },
];

const KIT = [
  {
    when: "Right after the handoff",
    items: [
      ["/design-grill", "questions you until the decisions are clear, then writes them into the repo, so “no shadows on cards” survives the next session."],
      ["/design-empathy", "reads the built flow for what it assumes about people, and records only what you confirm."],
    ],
  },
  {
    when: "Before a change ships",
    items: [
      ["/design-enforce", "finds colours and sizes typed by hand where a token already exists, and puts the token back."],
      ["/design-critic", "gives an honest read of a screen, ranked by severity, with the reason attached."],
      ["/anti-slop-designer", "catches the machine-made look: untouched library defaults, identical cards, gradients nobody chose."],
    ],
  },
  {
    when: "When one thing feels off",
    items: [
      ["/accessibility-specialist", "contrast, labels, keyboard paths and landmarks against WCAG."],
      ["/color-specialist", "contrast below AA, a palette with no system, dark mode that is just inverted."],
      ["/typography-specialist", "sizes off the scale, headings that don’t lead, cramped line height."],
      ["/spacing-layout-specialist", "padding and gaps off the scale, layouts with no grid underneath."],
      ["/visual-hierarchy-specialist", "screens where everything shouts and nothing leads."],
      ["/responsive-design-specialist", "layouts that break between sizes."],
      ["/content-strategist", "error messages, empty states and labels that say nothing."],
    ],
  },
  {
    when: "Looking at the whole product",
    items: [
      ["dwic-audit", "one pass over the code for accessibility, forms, navigation and copy."],
      ["/design-triage", "turns a long list of findings into an order you can work through."],
    ],
  },
];

export default function AfterYourDesignBecomesCode() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className={styles.page}>
        <Link href="/design-research" className={styles.back}>
          ← Design Research
        </Link>
        <p className={styles.eyebrow}>Essay &middot; November 2026</p>
        <h1 className={styles.title}>{PAGE_TITLE}</h1>
        <p className={styles.lede}>
          Claude Design now lives inside Claude, one step from Claude Code. Anthropic has built the handoff from one to
          the other. What nobody has built yet is what happens after it, when the design becomes code and starts to drift.
        </p>
        <div className={styles.meta}>
          <span>By <b>Imran Mohammed</b></span>
          <span>13 November 2026</span>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>What changed</h2>
          <p className={styles.caption}>
            Designs, design systems and decks are now made as artifacts in Claude, and the standalone site at
            claude.ai/design closes on 14 December 2026 (<a href={MOVE_URL} {...ext}>Anthropic</a>). If you used it, move
            your design systems and projects before then. Chats, comments and public links don&rsquo;t come across, so
            save what you need.
          </p>
          <p className={styles.caption}>
            The bigger change is where it now sits. Exploring how something should look and building the thing that
            ships are now one click apart. Most designers will use both, so the useful question is which one to reach
            for, and what to do at the seam.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Which one for what</h2>
          <div className={d.tableWrap}>
            <table className={d.table}>
              <caption className={d.tableCap}>Where each one is stronger</caption>
              <thead>
                <tr><th scope="col">Task</th><th scope="col">Claude Design</th><th scope="col">Claude Code</th></tr>
              </thead>
              <tbody>
                {WHICH.map((r) => (
                  <tr key={r.task}>
                    <th scope="row">{r.task}</th>
                    <td className={r.wins === "design" ? d.win : undefined}>{r.design}</td>
                    <td className={r.wins === "code" ? d.win : undefined}>{r.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.caption}>Explore in Claude Design. Build, and keep it right, in Claude Code.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>The handoff is solved</h2>
          <p className={styles.caption}>
            Anthropic gives you three ways across (<a href={START_URL} {...ext}>help centre</a>):
          </p>
          <ul className={d.list}>
            <li><strong>Send to Claude Code</strong> from the Share menu, which hands the design to a local or cloud session.</li>
            <li><strong>Ask in the chat</strong> for a handoff, and Claude writes a <code>HANDOFF.md</code> build spec: tokens, layout, components, states, accessibility.</li>
            <li><strong>Download the bundle</strong> of HTML, CSS and assets, and drop it into a Claude Code session.</li>
          </ul>
          <p className={styles.caption}>All three get the first version right. None of them looks after the second, third or tenth.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>What happens after it</h2>
          <p className={styles.caption}>
            Drift doesn&rsquo;t come from one bad change. It comes from small ones that each skip the design system: a
            colour typed by hand, a decision nobody wrote down. Each looks fine in review. Together they pull the product
            away from the design you agreed on.
          </p>
          <p className={styles.caption}>
            Take one pricing card, handed off from Claude Design with its design system. Here is a plausible eight weeks
            of ordinary requests. It&rsquo;s a worked example, not a real project.
          </p>

          <figure className={d.viz}>
            <span className={d.vlabel}>One card, as handed off and eight weeks later</span>
            <div className={d.cards} role="img" aria-label="Two copies of the same pricing card. The second has an orange button, a shadow, a faded caption and tighter padding, numbered 1 to 4.">
              <div className={d.col}>
                <span className={d.ctag}>As handed off</span>
                <div className={d.pc}>
                  <p className={d.pcName}>Studio</p>
                  <p className={d.pcPrice}>£12 <span>/ month</span></p>
                  <p className={d.pcCap}>For freelancers sending up to 50 invoices a month.</p>
                  <span className={d.pcBtn}>Start free trial</span>
                </div>
              </div>
              <div className={d.col}>
                <span className={d.ctag}>Eight weeks later</span>
                <div className={`${d.pc} ${d.pcLate}`}>
                  <i className={`${d.pin} ${d.pinCorner}`}>2</i>
                  <p className={d.pcName}>Studio</p>
                  <p className={d.pcPrice}>£12 <span>/ month</span></p>
                  <p className={d.pcCap}>For freelancers sending up to 50 invoices a month. <i className={d.pin}>3</i></p>
                  <span className={d.pcBtn}>Start free trial <i className={d.pin}>1</i></span>
                  <i className={`${d.pin} ${d.pinFoot}`}>4</i>
                </div>
              </div>
            </div>
            <ol className={d.changes}>
              {CHANGES.map((c) => (
                <li key={c.pin}>
                  <i className={d.pin} aria-hidden="true">{c.pin}</i>
                  <div><b>{c.when}</b> {c.what}</div>
                </li>
              ))}
            </ol>
            <figcaption className={d.vcap}>Contrast ratios are calculated from the colours shown. Each change passed review on its own.</figcaption>
          </figure>

          <p className={styles.caption}>
            In the code, every one of those changes looks the same: a value typed by hand where a token already existed.
          </p>
          <figure className={d.viz}>
            <span className={d.vlabel}>The same button, in the code</span>
            <div className={d.diff} role="img" aria-label="The button's background changes from the brand token to #ff6a3d, and its padding from a spacing token to 13px.">
              <p className={d.del}>- background: var(--color-brand);</p>
              <p className={d.add}>+ background: #ff6a3d;</p>
              <p className={d.del}>- padding: var(--space-4);</p>
              <p className={d.add}>+ padding: 13px;</p>
            </div>
            <figcaption className={d.vcap}>Nothing errors and nothing breaks, which is why nobody notices.</figcaption>
          </figure>
          <p className={styles.caption}>
            None of this is Claude getting worse. It&rsquo;s what happens to any design once many small hands touch it,
            and Claude Code is a lot of very fast hands.
          </p>
          <div className={d.try}>
            <span className={d.tryLabel}>Try this yourself</span>
            <p>
              A week after a handoff, search the code for colours written by hand:{" "}
              <code>grep -rnE &quot;#[0-9a-fA-F]{"{3,6}"}\b&quot; src</code>. Every result that isn&rsquo;t in your design
              system is a place the build has already left the design.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Keeping the design intact in the repo</h2>
          <p className={styles.caption}>
            This is where dwic sits, on the Claude Code side of the seam. Each command does one job, and they fit
            different moments after a handoff.
          </p>
          <figure className={d.viz}>
            <span className={d.vlabel}>dwic commands, by when you reach for them</span>
            <div className={d.kit}>
              {KIT.map((g) => (
                <div className={d.kgroup} key={g.when}>
                  <span className={d.kwhen}>{g.when}</span>
                  <ul>
                    {g.items.map(([cmd, text]) => (
                      <li key={cmd}><code>{cmd}</code> {text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <figcaption className={d.vcap}>
              All free in the dwic plugin. Each one reads your code; none of them can see the rendered screen, so they
              mark what needs a look in the browser.
            </figcaption>
          </figure>
          <div className={d.try}>
            <span className={d.tryLabel}>Try this yourself</span>
            <p>
              Right after a handoff, write down three decisions a new session couldn&rsquo;t guess from the code alone,
              like why the cards have no shadow. Put them in your project&rsquo;s <code>CLAUDE.md</code>. That alone stops
              most drift of the second kind.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Start here</h2>
          <p className={styles.caption}>
            Explore in Claude Design until the direction is settled. Hand it off whichever way suits you. Then, before the
            first change request, install dwic and run <code>/design-grill</code> once, so the decisions travel with the
            code:
          </p>
          <pre className={styles.code}>{`/plugin marketplace add imsaif/design-with-claude
/plugin install design-with-claude@design-with-claude
/reload-plugins`}</pre>
          <p className={styles.caption}>If moving between the two still feels clumsy somewhere, I&rsquo;d like to hear where.</p>
        </section>

        <div className={styles.method}>
          <h3>Sources</h3>
          <ul className={d.list}>
            <li>Anthropic, Move from standalone Claude Design to Claude. <a href={MOVE_URL} {...ext}>support.claude.com</a></li>
            <li>Anthropic, Get started with Claude Design. <a href={START_URL} {...ext}>support.claude.com</a></li>
            <li>Anthropic, Introducing Claude Design by Anthropic Labs. <a href={INTRO_URL} {...ext}>anthropic.com</a></li>
            <li>
              Related: <Link href="/design-research/building-empathy-in-the-terminal">Building empathy in the terminal</Link>.
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
}
