import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../research.module.css";
import e from "./empathy.module.css";
import { StepSlider } from "./StepSlider";
import { TerminalRun } from "./TerminalRun";

const SITE_URL = "https://www.designwithclaude.com";
const PAGE_PATH = "/design-research/building-empathy-in-the-terminal";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Building empathy in the terminal";
const PAGE_DESCRIPTION =
  "AI coding tools let designers ship without meeting a user, and empathy is the step AI is weakest at. How dwic puts it back inside the terminal: reading your code for the assumptions it makes about people, questioning you without inventing users, and handing the why back to the real person.";
const DATE_PUBLISHED = "2026-11-13";
const COURSE_URL = "https://academy.claude.com/courses/ai-fluency-for-builders";

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

const RUNGS = [
  { name: "observed", means: "You saw them do it.", ex: "Watched her skip the bank step on a call." },
  { name: "reported", means: "They told you, in their own words.", ex: "“I found out a client was a month late only when I checked my bank.”" },
  { name: "public", means: "Real people, but not your users.", ex: "A competitor’s app-store review." },
  { name: "recalled", means: "Your memory of a real moment.", ex: "“A photographer I demoed to quit at the bank step.”" },
  { name: "assumed", means: "No source yet.", ex: "“Users want it simple.”" },
];

const WHYS = [
  { why: "in a rush, meaning to come back", fix: "a clear “finish later” that saves her place" },
  { why: "wary of giving a new app her bank details", fix: "the bank step moved to after she’s seen value" },
  { why: "following a rule: never before I’ve been paid", fix: "no bank step in setup at all" },
];

export default function BuildingEmpathyInTheTerminal() {
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
        <h1 className={styles.title}>Building empathy in the terminal</h1>
        <p className={styles.lede}>
          AI coding tools let you go from an idea to something live without ever meeting a user. This is how dwic puts
          empathy back into that loop, inside the terminal: by reading your code for what it assumes about people, and
          questioning you without ever inventing a user.
        </p>
        <div className={styles.meta}>
          <span>By <b>Imran Mohammed</b></span>
          <span>13 November 2026</span>
        </div>

        <StepSlider courseUrl={COURSE_URL} />

        <p className={styles.caption}>
          With Claude Code you can go from an idea to something live in an afternoon, and nothing in that loop asks who
          it&rsquo;s for. This is how I tried to put that step back inside the terminal, without letting the AI pretend
          to be the user.
        </p>

        <TerminalRun />

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>What empathy means in product work</h2>
          <p className={styles.caption}>
            Not feeling for someone. Indi Young calls the useful kind cognitive empathy: understanding how another person
            thinks. In <a href="https://alistapart.com/article/a-new-way-to-listen" {...ext}>A New Way to Listen</a>, she
            asks people to recall what went through their mind during something they did, and listens for the whys, not
            their opinions. Her line for the listener: &ldquo;It&rsquo;s her mind, and you&rsquo;re the tourist.&rdquo;
          </p>
          <p className={styles.caption}>
            So empathy isn&rsquo;t how sure you feel about your users. It&rsquo;s how much you know about how they think,
            and how much of that came from them.
          </p>
          <p className={styles.caption}>
            That&rsquo;s also why AI can&rsquo;t do it for you. When Nielsen Norman Group{" "}
            <a href="https://www.nngroup.com/articles/synthetic-users-vs-human-respondents/" {...ext}>compared synthetic and real users</a>,
            the synthetic answers clustered around the average and lost the unusual ones, which is often where the real
            problem is. And personas, AI-made or not,{" "}
            <a href="https://quantuxbook.com/papers/Chapman-Milham-Personas-HFES2006-0139-0330.pdf" {...ext}>can&rsquo;t be checked for accuracy</a>.
            So dwic&rsquo;s first rule: never invent a user, a quote or an interview.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>How it&rsquo;s meant to work, and how it actually goes</h2>
          <p className={styles.caption}>
            In the textbook version, you listen to people first, find the patterns, then design, then test with people
            again. Building with an AI tool skips all of it. You&rsquo;re often the designer, researcher and developer at
            once, with no notes and no users yet. Who it&rsquo;s for is whatever was in your head when you typed the
            prompt.
          </p>
          <figure className={e.viz} role="img" aria-label="The research loop: listen, find patterns, build, test with people, repeat. Building with AI: idea, prompt, shipped. Nobody else gets asked.">
            <div className={e.compare}>
              <div className={e.panel}>
                <span className={e.vlabel}>How it&rsquo;s meant to work</span>
                <div className={e.loop}>
                  <div className={e.node}>Listen to people</div><span className={e.arrow}>→</span><div className={e.node}>Find the patterns</div>
                  <span className={e.arrow}>↑</span><span /><span className={e.arrow}>↓</span>
                  <div className={e.node}>Test with people</div><span className={e.arrow}>←</span><div className={e.node}>Design and build</div>
                </div>
                <p className={e.pnote}>A loop. People come first, and come back every round.</p>
              </div>
              <div className={e.panel}>
                <span className={e.vlabel}>How it often goes with AI</span>
                <div className={e.line}>
                  <div className={`${e.node} ${e.nodeQuiet}`}>Idea</div><span className={e.arrow}>→</span>
                  <div className={`${e.node} ${e.nodeQuiet}`}>Prompt</div><span className={e.arrow}>→</span>
                  <div className={`${e.node} ${e.nodeQuiet}`}>Shipped</div>
                </div>
                <div className={e.missing}>Who is it for?<span>Whatever was in your head when you typed the prompt.</span></div>
                <p className={e.pnote}>A straight line. You asked nobody outside your head.</p>
              </div>
            </div>
          </figure>
          <p className={styles.caption}>
            My first version assumed the textbook: it organised interview notes most people don&rsquo;t have. What I
            wanted was something that helps you build empathy from wherever you are. Then I noticed everyone does have
            evidence of one thing: what they believe about their users. It&rsquo;s in their code.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Your code already says who you think your users are</h2>
          <p className={styles.caption}>
            We don&rsquo;t read our own code as claims about people, because we wrote it. That&rsquo;s the{" "}
            <a href="https://doi.org/10.1086/261651" {...ext}>curse of knowledge</a>. In a Stanford study, people tapping
            famous songs expected listeners to name half; listeners named about 1 in 40 (
            <a href="https://hbr.org/2006/12/the-curse-of-knowledge" {...ext}>Heath and Heath, HBR</a>). Designers
            reading their own forms are the tappers.
          </p>
          <figure className={e.viz} role="img" aria-label="Three lines of code read as claims about people">
            <span className={e.vlabel}>Read a line of code as a sentence about people</span>
            <div className={e.claim}><pre className={e.claimCode}>&lt;input name=&quot;phone&quot; required /&gt;</pre><span className={e.arrow}>→</span><p className={e.claimText}>Everyone has a phone number, and will give it to us before seeing anything.</p></div>
            <div className={e.claim}><pre className={e.claimCode}>{`const STEPS = [5 steps]\n// all required before first invoice`}</pre><span className={e.arrow}>→</span><p className={e.claimText}>People will push through all five before they get any value.</p></div>
            <div className={e.claim}><pre className={e.claimCode}>{`"You entered an invalid phone number."`}</pre><span className={e.arrow}>→</span><p className={e.claimText}>When something goes wrong, it&rsquo;s the user&rsquo;s mistake.</p></div>
          </figure>
          <div className={e.try}>
            <span className={e.tryLabel}>Try this yourself</span>
            <p>
              Take one flow. For every required field, step, default and error message, write a sentence starting
              &ldquo;This assumes people…&rdquo;. Circle the three you&rsquo;d least like to be wrong about.
            </p>
          </div>
          <p className={styles.caption}>
            That&rsquo;s what <code>/design-empathy</code> does with you. Point it at one flow and it lists what the code
            assumes about people, with the file and line, then asks you about the riskiest three.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Questioning yourself without wearing yourself out</h2>
          <p className={styles.caption}>
            Being questioned about your assumptions is useful and tiring. Advait Sarkar warns in{" "}
            <a href="https://arxiv.org/html/2411.02263v2" {...ext}>AI Should Challenge, Not Obey</a> that an AI that keeps
            challenging you wears you out. So dwic asks three questions, each narrower than the last and each about a moment that already happened, since people are{" "}
            <a href="https://eprints.whiterose.ac.uk/1580" {...ext}>poor at predicting</a> their own behaviour. Then it stops:
          </p>
          <figure className={e.viz} role="img" aria-label="Three questions narrow a vague belief to a real moment. It ends with: she sent it from Word.">
            <span className={e.vlabel}>Three questions, from a belief to a moment</span>
            <div className={e.funnel}>
              <div className={`${e.step} ${e.w1}`}>&ldquo;Users want it to be simple.&rdquo;</div>
              <span className={e.q}>Who, specifically?</span>
              <div className={`${e.step} ${e.w2}`}>&ldquo;Freelancers.&rdquo;</div>
              <span className={e.q}>When did you last see them do it?</span>
              <div className={`${e.step} ${e.w3}`}>&ldquo;Priya, last Thursday, sending an invoice.&rdquo;</div>
              <span className={e.q}>What did they do instead?</span>
              <div className={`${e.step} ${e.w4}`}>&ldquo;She gave up and sent it from Word.&rdquo;</div>
            </div>
          </figure>
          <p className={styles.caption}>
            If there&rsquo;s still no real person after three, it says so and records the belief as an assumption. And
            every question carries one line explaining why it asked, so you learn to ask it yourself.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Say how you know what you know</h2>
          <p className={styles.caption}>
            What would make me wince is Claude Code inventing users or quotes, calling it evidence, and recording it without
            anyone confirming. So dwic proposes, and you decide what gets written.
          </p>
          <figure className={e.viz} role="img" aria-label="dwic asks and proposes. You choose what to keep. dwic writes only that to EMPATHY.md.">
            <span className={e.vlabel}>dwic writes nothing without you</span>
            <div className={e.flow}>
              <div className={e.flowNode}><b>dwic</b>reads the flow and asks you</div><span className={e.arrow}>→</span>
              <div className={e.flowNode}><b>dwic</b>shows &ldquo;Proposed for EMPATHY.md&rdquo;: 1. … 2. … 3. …</div><span className={e.arrow}>→</span>
              <div className={`${e.flowNode} ${e.flowYou}`}><b>You</b>&ldquo;Keep 1 and 3.&rdquo;</div><span className={e.arrow}>→</span>
              <div className={`${e.flowNode} ${e.flowFile}`}><b>EMPATHY.md</b>dwic writes only 1 and 3</div>
            </div>
          </figure>
          <p className={styles.caption}>And every point is labelled by how it&rsquo;s known, a habit worth stealing for any research doc:</p>
          <div className={e.tableWrap}>
            <table className={e.table}>
              <caption className={e.tableCap}>How it&rsquo;s known, strongest first</caption>
              <thead>
                <tr><th scope="col">Label</th><th scope="col">What it means</th><th scope="col">Example</th></tr>
              </thead>
              <tbody>
                {RUNGS.map((r) => (
                  <tr key={r.name}><td>{r.name}</td><td>{r.means}</td><td>{r.ex}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.caption}>
            &ldquo;Recalled&rdquo; matters most. A real moment you remember is more than a guess, but nobody can check
            it. Without its own label, memories quietly become evidence.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>The why belongs to the user</h2>
          <p className={styles.caption}>
            Knowing what someone did is half of it. The why decides what you build:
          </p>
          <figure className={e.viz} role="img" aria-label="One behaviour with three possible reasons, leading to three different designs.">
            <div className={e.root}>She quit at the connect-your-bank step.</div>
            <div className={e.branches}>
              {WHYS.map((w) => (
                <div className={e.branch} key={w.why}>
                  <div className={e.why}><b>If she was</b>{w.why}</div>
                  <div className={e.down}>↓</div>
                  <div className={e.fix}><b>Then build</b>{w.fix}</div>
                </div>
              ))}
            </div>
            <figcaption className={e.vcap}>Same behaviour, three whys, three different products.</figcaption>
          </figure>
          <p className={styles.caption}>
            But as a builder you usually don&rsquo;t know the why, and pushing you would only produce a guess. So dwic
            asks once, &ldquo;Did she say why?&rdquo; If not, it records <code>why: unknown</code> and turns it into Young&rsquo;s
            question for the real person: what was going through your mind?
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>Why do this in the terminal, with dwic</h2>
          <p className={styles.caption}>You could do all of this with a notebook. In practice, few of us do. dwic helps because:</p>
          <ul className={e.list}>
            <li><strong>It shows assumptions you can&rsquo;t see</strong> in your own code, with the file and line.</li>
            <li><strong>It asks the follow-ups you&rsquo;d skip</strong> on yourself, and stops after three.</li>
            <li><strong>It won&rsquo;t let a guess pass as a fact,</strong> and writes nothing until you say yes.</li>
            <li>
              <strong>It works before you have users.</strong> It can search public reviews and forums for what real
              people say, check each quote is on its page, and label it public. That runs on your own Claude account, so
              it asks first.
            </li>
            <li><strong>What you learn gets used:</strong> dwic&rsquo;s copy and form commands read <code>.dwic/EMPATHY.md</code>.</li>
          </ul>
          <p className={styles.caption}>
            It&rsquo;s early. So far only its builder has used it, the weakest evidence there is by its own labels, and it
            doesn&rsquo;t yet help you listen for reasoning in your own interview notes. That&rsquo;s next.
          </p>
          <p className={styles.caption}>dwic is free as a Claude Code plugin:</p>
          <pre className={styles.code}>{`/plugin marketplace add imsaif/design-with-claude
/plugin install design-with-claude@design-with-claude
/reload-plugins`}</pre>
          <p className={styles.caption}>
            Then run <code>/design-with-claude:design-empathy the signup flow</code>. If you try it, I&rsquo;d like to hear
            where it felt wrong.
          </p>
        </section>

        <div className={styles.method}>
          <h3>Sources</h3>
          <ul className={e.list}>
            <li>Anthropic, <em>AI Fluency for Builders</em>. <a href={COURSE_URL} {...ext}>academy.claude.com</a></li>
            <li>Indi Young (2015), A New Way to Listen, A List Apart. <a href="https://alistapart.com/article/a-new-way-to-listen" {...ext}>alistapart.com</a></li>
            <li>Webb and Sheeran (2006), Does changing behavioral intentions engender behavior change? <a href="https://eprints.whiterose.ac.uk/1580" {...ext}>eprints.whiterose.ac.uk</a></li>
            <li>Nielsen Norman Group, Synthetic Users vs Human Respondents. <a href="https://www.nngroup.com/articles/synthetic-users-vs-human-respondents/" {...ext}>nngroup.com</a></li>
            <li>Chapman and Milham (2006), The personas&rsquo; new clothes. <a href="https://quantuxbook.com/papers/Chapman-Milham-Personas-HFES2006-0139-0330.pdf" {...ext}>quantuxbook.com</a></li>
            <li>Heath and Heath (2006), The Curse of Knowledge, Harvard Business Review. <a href="https://hbr.org/2006/12/the-curse-of-knowledge" {...ext}>hbr.org</a></li>
            <li>Camerer, Loewenstein and Weber (1989), The curse of knowledge in economic settings. <a href="https://doi.org/10.1086/261651" {...ext}>doi.org</a></li>
            <li>Advait Sarkar (2024), AI Should Challenge, Not Obey. <a href="https://arxiv.org/html/2411.02263v2" {...ext}>arxiv.org</a></li>
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
}
