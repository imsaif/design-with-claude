import Link from "next/link";
import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import styles from "../research.module.css";
import e from "./empathy.module.css";

const SITE_URL = "https://www.designwithclaude.com";
const PAGE_PATH = "/design-research/building-empathy-in-the-terminal";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Building empathy in the terminal";
const PAGE_DESCRIPTION =
  "AI coding tools let designers ship without meeting a user, and empathy is the step AI is weakest at. How dwic puts it back inside the terminal: reading your code for the assumptions it makes about people, questioning you without inventing users, and handing the why back to the real person.";
const DATE_PUBLISHED = "2026-11-13";

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

function Spot({ name }: { name: string }) {
  return (
    <div className={e.spot} aria-hidden="true">
      <img src={`/doodles/${name}.svg`} alt="" />
    </div>
  );
}

const STEPS = [
  { name: "Empathy", ai: "weak" },
  { name: "Design", ai: "moderate" },
  { name: "Architecture", ai: "moderate" },
  { name: "Implementation", ai: "strong" },
  { name: "Judgment", ai: "weak" },
  { name: "Shipping", ai: "moderate" },
];

const RUNGS = [
  { name: "observed", n: 5, means: "You saw them do it.", ex: "Watched her skip the bank step on a call." },
  { name: "reported", n: 4, means: "They told you, in their own words.", ex: "“I found out a client was a month late only when I checked my bank.”" },
  { name: "public", n: 3, means: "Real people, but not your users.", ex: "A competitor’s app-store review." },
  { name: "recalled", n: 2, means: "Your memory of a real moment.", ex: "“A photographer I demoed to quit at the bank step.”" },
  { name: "assumed", n: 1, means: "No source yet.", ex: "“Users want it simple.”" },
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
          I was going through Anthropic&rsquo;s{" "}
          <a href="https://anthropic-partners.skilljar.com/path/claude-architect/ai-fluency-for-builders/486159" {...ext}>
            AI Fluency for Builders
          </a>{" "}
          course and one page stopped me. It splits building into six steps and tags each one with where AI stands.
          Implementation: AI strong. Empathy: AI weak. &ldquo;AI can surface data and personas, it can&rsquo;t feel the
          gap.&rdquo;
        </p>
        <div className={styles.meta}>
          <span>By <b>Imran Mohammed</b></span>
          <span>13 November 2026</span>
        </div>

        <figure
          className={e.viz}
          role="img"
          aria-label="Six build steps and where AI stands. Empathy and Judgment: AI weak. Implementation: AI strong. The rest: moderate."
        >
          <span className={e.vlabel}>Six build steps, and where AI stands</span>
          <div className={e.steps}>
            {STEPS.map((s, i) => (
              <div className={s.name === "Empathy" ? `${e.stepCard} ${e.stepCardOn}` : e.stepCard} key={s.name}>
                <span className={e.stepNum}>{i + 1}</span>
                <span className={e.stepName}>{s.name}</span>
                <span className={`${e.rating} ${s.ai === "weak" ? e.ratingWeak : s.ai === "strong" ? e.ratingStrong : ""}`}>AI {s.ai}</span>
              </div>
            ))}
          </div>
          <figcaption className={e.vcap}>
            Ratings from Anthropic&rsquo;s{" "}
            <a href="https://anthropic-partners.skilljar.com/path/claude-architect/ai-fluency-for-builders/486159" {...ext}>
              AI Fluency for Builders
            </a>{" "}
            course.
          </figcaption>
        </figure>

        <p className={styles.caption}>
          That tag stayed with me for days. A lot of designers now build with Claude Code. You can go from an idea to
          something live in an afternoon, and nothing in that loop ever asks you who it&rsquo;s for. The step AI is
          worst at is the one that quietly disappears first.
        </p>
        <p className={styles.caption}>
          This is the story of how I tried to put that step back, inside the terminal, without letting the AI pretend
          to be the user. Along the way I had to unlearn a few things about empathy myself, so I&rsquo;ve written those
          up too. You can use most of this without dwic at all.
        </p>

        <section className={styles.section}>
          <Spot name="headphone" />
          <h2 className={styles.sectionHead}>What empathy actually means in product work</h2>
          <p className={styles.caption}>
            When designers say empathy, we often mean feeling for someone. That&rsquo;s not quite the useful kind here.
            Indi Young, who has spent years on this, calls the useful kind cognitive empathy: understanding how another
            person thinks. What they were trying to do, what went through their mind, how they reacted, and the rules
            they live by.
          </p>
          <p className={styles.caption}>
            In <a href="https://alistapart.com/article/a-new-way-to-listen" {...ext}>A New Way to Listen</a>, she
            describes sitting with someone and asking them to recall what went through their mind during something they
            actually did, then listening for the whys underneath: the indecision, the emotion, the trade-offs. Not their
            opinions. Not their feature requests. Her line for the listener is one I keep coming back to: &ldquo;It&rsquo;s
            her mind, and you&rsquo;re the tourist.&rdquo;
          </p>
          <p className={styles.caption}>
            That gives us a useful test. Empathy isn&rsquo;t how sure you feel about your users. It&rsquo;s how much you
            actually know about how they think, and how much of that came from them rather than from you.
          </p>
        </section>

        <section className={styles.section}>
          <Spot name="microscope" />
          <h2 className={styles.sectionHead}>Three things that shaped the design</h2>
          <p className={styles.caption}>
            Three findings about understanding users, and about where AI helps or hurts, changed how I built this.
          </p>
          <h3 className={e.subHead}>1. What people did beats what they say they will do</h3>
          <p className={styles.caption}>
            You know this one. What I hadn&rsquo;t appreciated is the size of the gap. A{" "}
            <a href="https://eprints.whiterose.ac.uk/1580" {...ext}>review of 47 experiments</a> found that when what
            people intend changes, what they actually do changes by only about half as much. So in dwic it isn&rsquo;t a
            guideline, it&rsquo;s a rule: every question is about a moment that already happened.
          </p>
          <figure className={e.viz} role="img" aria-label="Behaviour changes about half as much as intention: 0.66 against 0.36">
            <span className={e.vlabel}>When intention moves, behaviour moves about half as far</span>
            <div className={e.barRow}><span>What people say they&rsquo;ll do</span><div className={`${e.bar} ${e.barFull}`}>0.66</div></div>
            <div className={e.barRow}><span>What they actually do</span><div className={`${e.bar} ${e.barHalf}`}>0.36</div></div>
            <figcaption className={e.vcap}>
              Average effect sizes across 47 experiments,{" "}
              <a href="https://eprints.whiterose.ac.uk/1580" {...ext}>Webb and Sheeran (2006)</a>.
            </figcaption>
          </figure>
          <h3 className={e.subHead}>2. AI-made users fail exactly where the gaps are</h3>
          <p className={styles.caption}>
            It&rsquo;s tempting to ask an AI to role-play your user. When Nielsen Norman Group{" "}
            <a href="https://www.nngroup.com/articles/synthetic-users-vs-human-respondents/" {...ext}>compared synthetic and real users</a>,
            the synthetic answers clustered around the average and lost the variety real people show. That&rsquo;s a
            problem because the unusual answer, the person who does it differently, is often where the real opportunity
            is. NN/g also found synthetic users{" "}
            <a href="https://www.nngroup.com/articles/synthetic-users/" {...ext}>overly positive and shallow</a>,
            treating every need as equally important, which makes them useless for deciding what matters.
          </p>
          <p className={styles.caption}>
            The way I think about it: an AI persona is a very confident average. It sounds like a person, but it has
            never paid an invoice late or rage-quit a setup screen.
          </p>
          <h3 className={e.subHead}>3. Personas don&rsquo;t do what we hope</h3>
          <p className={styles.caption}>
            Even human-made personas struggle.{" "}
            <a href="https://quantuxbook.com/papers/Chapman-Milham-Personas-HFES2006-0139-0330.pdf" {...ext}>There&rsquo;s no way to check a persona for accuracy</a>,
            and a{" "}
            <a href="https://research.google/pubs/how-do-designers-and-user-experience-professionals-actually-perceive-and-use-personas/" {...ext}>study of how designers actually use them</a>{" "}
            found they&rsquo;re rarely consulted when real decisions are made. They tend to describe the user we already
            had in mind.
          </p>
          <p className={styles.caption}>
            So the first rule for dwic wrote itself. It would never invent a user, a quote or an interview. If
            there&rsquo;s no evidence, it says so, out loud.
          </p>
        </section>

        <section className={styles.section}>
          <Spot name="folder-empty" />
          <h2 className={styles.sectionHead}>How it&rsquo;s meant to work, and how it actually goes</h2>
          <p className={styles.caption}>
            In the textbook version, empathy comes first. Before anyone designs a screen, someone talks to the people
            it&rsquo;s for: listening sessions, interviews, watching them do the real task. The notes get pulled together
            into patterns, what people are trying to do and where they get stuck, and only then does design start. When
            the design is built, it goes back in front of real people, and what you learn feeds the next round. In a
            team, there&rsquo;s often a researcher whose job is to keep that loop running.
          </p>
          <p className={styles.caption}>
            Building with an AI coding tool tends to skip straight past all of it. You have an idea in the morning and a
            working signup flow by lunch. Often you&rsquo;re the designer, the researcher and the developer at once.
            There&rsquo;s no researcher, no interview notes, and frequently no users yet, because the product didn&rsquo;t
            exist until today. The understanding of who it&rsquo;s for is whatever was in your head when you typed the
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
            My first version of dwic assumed the textbook. It was an evidence organiser: give it interview notes and
            support emails, and it pulled out needs with real quotes and where they came from. It worked, and it was the
            wrong thing, because most people building this way have nothing to give it.
          </p>
          <p className={styles.caption}>
            What I actually wanted was something that fits how people really build now. Not a research tool waiting for
            research that never happens. Something that helps you build empathy from wherever you are. One that
            questions you back, pushes on the vague bits, and teaches you the method as you go, so the real
            conversations with users are sharper when they come.
          </p>
          <p className={styles.caption}>
            And then I noticed that everyone does have evidence of one thing. What they believe about their users.
            It&rsquo;s sitting in their code.
          </p>
        </section>

        <section className={styles.section}>
          <Spot name="file-code" />
          <h2 className={styles.sectionHead}>Your code already says who you think your users are</h2>
          <p className={styles.caption}>
            Every decision about people ends up somewhere in the code. We just don&rsquo;t read it that way, because we
            wrote it, and to us it&rsquo;s just &ldquo;the form&rdquo;. Once you know something, it&rsquo;s very hard to
            imagine not knowing it. It&rsquo;s called the{" "}
            <a href="https://doi.org/10.1086/261651" {...ext}>curse of knowledge</a>. In a well-known Stanford study,
            people tapped out famous songs on a table and predicted listeners would name about half; listeners got about
            1 in 40, because only the tappers could hear the tune in their heads (
            <a href="https://hbr.org/2006/12/the-curse-of-knowledge" {...ext}>Heath and Heath, HBR</a>). Designers
            looking at their own forms are the tappers.
          </p>
          <figure className={e.viz} role="img" aria-label="Three lines of code read as claims about people">
            <span className={e.vlabel}>Read a line of code as a sentence about people</span>
            <div className={e.claim}><pre className={e.claimCode}>&lt;input name=&quot;phone&quot; required /&gt;</pre><span className={e.arrow}>→</span><p className={e.claimText}>Everyone has a phone number, and will give it to us before seeing anything.</p></div>
            <div className={e.claim}><pre className={e.claimCode}>{`const STEPS = [5 steps]\n// all required before first invoice`}</pre><span className={e.arrow}>→</span><p className={e.claimText}>People will push through all five before they get any value.</p></div>
            <div className={e.claim}><pre className={e.claimCode}>{`"You entered an invalid phone number."`}</pre><span className={e.arrow}>→</span><p className={e.claimText}>When something goes wrong, it&rsquo;s the user&rsquo;s mistake.</p></div>
          </figure>
          <p className={styles.caption}>Here&rsquo;s where assumptions about people usually hide:</p>
          <div className={e.tableWrap}>
            <table className={e.table}>
              <thead><tr><th scope="col">In the code</th><th scope="col">What it assumes about people</th></tr></thead>
              <tbody>
                <tr><td>required phone field</td><td>Everyone has a number, and is happy to hand it over before seeing any value.</td></tr>
                <tr><td>5-step setup</td><td>People will push through all five before they get anything, in this order.</td></tr>
                <tr><td>&ldquo;You entered an invalid…&rdquo;</td><td>When something goes wrong, the user is the one who made the mistake.</td></tr>
                <tr><td>default values</td><td>Most people want what you picked for them.</td></tr>
                <tr><td>empty states</td><td>People know what to do when there&rsquo;s nothing there yet.</td></tr>
                <tr><td>roles and permissions</td><td>Who is allowed to do what, and that they&rsquo;ll accept it.</td></tr>
              </tbody>
            </table>
          </div>
          <div className={e.try}>
            <span className={e.tryLabel}>Try this yourself</span>
            <p>
              Open one flow you&rsquo;ve built, say signup. For every required field, step, default and error message,
              write one sentence starting &ldquo;This assumes people…&rdquo;. Then circle the three you&rsquo;d be most
              embarrassed to have wrong. Those are your riskiest assumptions.
            </p>
          </div>
          <p className={styles.caption}>
            That exercise is what <code>/design-empathy</code> does with you in the terminal. You point it at one flow,
            it reads the code, lists what it assumes about people with the exact file and line, ranks them, and asks you
            about the riskiest three.
          </p>
          <figure>
            <div className={e.term} role="img" aria-label="Example terminal session. dwic names an assumption in the code and asks who the designer had in mind. The unknown why becomes a question for the user.">
              <p className={e.termCap}>Example session · a test project&rsquo;s signup flow</p>
              <p>This code assumes every new account will finish all five setup steps, including connecting a bank, before sending a first invoice.  <span className={e.termDim}>app/onboarding/page.tsx:5</span></p>
              <p>Who did you have in mind, and when did you last see someone go through it?</p>
              <p className={e.termDim}>Why I&rsquo;m asking: what someone did last time predicts better than what they say they&rsquo;d do.</p>
              <p className={e.termYou}>› A freelance photographer I demoed to on 3 November quit at the bank step. Said she&rsquo;d finish later. Never came back.</p>
              <p>That&rsquo;s a real moment, so I&rsquo;ll propose recording it as recalled. Did she say why?</p>
              <p className={e.termYou}>› No.</p>
              <p>Then I&rsquo;ll record why: unknown, and add a question for her: &ldquo;When you stopped at the bank step, what was going through your mind?&rdquo;</p>
            </div>
            <figcaption className={e.vcap}>From the test project I built dwic against. In real use you answer as you go.</figcaption>
          </figure>
        </section>

        <section className={styles.section}>
          <Spot name="question" />
          <h2 className={styles.sectionHead}>How to question your own assumptions without wearing yourself out</h2>
          <p className={styles.caption}>
            This was the part I thought about most. If you tell dwic &ldquo;users want it to be simple&rdquo;, should it
            keep pushing until you name a real person? Being questioned about your own assumptions is useful, and also
            tiring. Advait Sarkar makes the same point in{" "}
            <a href="https://arxiv.org/html/2411.02263v2" {...ext}>AI Should Challenge, Not Obey</a>: an AI that keeps
            challenging you can wear you out, and then you stop listening to it.
          </p>
          <p className={styles.caption}>
            I settled on three questions, each one narrower than the last. They work just as well if you ask them of
            yourself:
          </p>
          <ol className={e.list}>
            <li><strong>Who, specifically?</strong> Not &ldquo;users&rdquo;. One person you could name.</li>
            <li><strong>When did you last see them do it?</strong> A real moment, with a rough date.</li>
            <li><strong>What did they do instead?</strong> What actually happened, not what should have.</li>
          </ol>
          <p className={styles.caption}>
            Here&rsquo;s how a vague belief usually travels through them: &ldquo;Users want it simple&rdquo; becomes
            &ldquo;freelancers&rdquo;, becomes &ldquo;Priya, last Thursday&rdquo;, becomes &ldquo;she gave up and sent the
            invoice from Word&rdquo;. That last line is something you can actually design for.
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
            If after three questions there&rsquo;s still no real person or moment, dwic stops and says so plainly: we
            haven&rsquo;t found anyone behind this, so it goes down as an assumption. No fourth push, and no pretending a
            guess is a finding. Saying &ldquo;this is a guess&rdquo; out loud is useful in itself. It tells you exactly
            what to go and find out.
          </p>
          <p className={styles.caption}>
            After every question there&rsquo;s one short line explaining why it asked. I added that because I wanted
            people to learn the method, not just get through the session. After a few sessions you start asking yourself
            these questions before you write the code.
          </p>
        </section>

        <section className={styles.section}>
          <Spot name="tag" />
          <h2 className={styles.sectionHead}>Say how you know what you know</h2>
          <p className={styles.caption}>
            I asked myself what would make me wince if dwic got this wrong in front of a designer. The answer came
            quickly. Inventing users or quotes and calling it evidence. Recording it as an empathy point without anyone
            confirming it.
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
          <p className={styles.caption}>
            So two rules. First, nothing gets written down until you&rsquo;ve seen the list of what dwic wants to record
            and said yes. It proposes, you decide. Second, every point is labelled by how it&rsquo;s known. This is a
            habit worth stealing for any research doc:
          </p>
          <figure className={e.viz} role="img" aria-label="Five evidence labels, strongest first: observed, reported, public, recalled, assumed.">
            <span className={e.vlabel}>How it&rsquo;s known, strongest first</span>
            {RUNGS.map((r) => (
              <div className={e.rung} key={r.name}>
                <span className={e.rungName}>{r.name}</span>
                <span className={e.pips}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <i key={i} className={i <= r.n ? `${e.pip} ${e.pipOn}` : e.pip} />
                  ))}
                </span>
                <p className={e.rungText}>{r.means}<small>{r.ex}</small></p>
              </div>
            ))}
          </figure>
          <p className={styles.caption}>
            &ldquo;Recalled&rdquo; came out of a real problem. When the questioning works and you name a real person and
            moment, that&rsquo;s clearly more than a guess. But it&rsquo;s your memory, and nobody can check it. Without
            its own label, a confident designer can quietly turn memories into evidence. With it, you can see at a glance
            how much of your understanding rests on things you remember versus things people told you.
          </p>
        </section>

        <section className={styles.section}>
          <Spot name="bulb" />
          <h2 className={styles.sectionHead}>The why belongs to the user, not to you</h2>
          <p className={styles.caption}>
            Knowing what someone did is half of it. Indi Young&rsquo;s point is that the why decides what you should
            build. Take the photographer who quit at the bank step:
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
            <figcaption className={e.vcap}>Same behaviour, three whys, three different products. Only she knows which one is true.</figcaption>
          </figure>
          <p className={styles.caption}>
            Get the why wrong and you can build the right-looking fix for the wrong problem.
          </p>
          <p className={styles.caption}>
            My first thought was to have dwic probe the designer for the why. Then I realised: as a builder, you usually
            don&rsquo;t know. She didn&rsquo;t tell you. If a tool keeps pushing you, you&rsquo;ll guess, and a guess
            written down as fact is exactly what I was trying to prevent.
          </p>
          <p className={styles.caption}>
            So dwic asks once. Did she say why? If she did, it records her words. If not, it writes{" "}
            <code>why: unknown</code> and turns it into a question for her: &ldquo;When you stopped at the bank step, what
            was going through your mind?&rdquo; That&rsquo;s Young&rsquo;s listening question, handed to the person who
            can actually go and ask it.
          </p>
          <div className={e.try}>
            <span className={e.tryLabel}>Try this yourself</span>
            <p>
              Look at the last thing you learnt about a user. Next to it, write the why. If the honest answer is
              &ldquo;I&rsquo;m guessing&rdquo;, write &ldquo;why: unknown&rdquo; instead, and turn it into one question
              you&rsquo;d ask them about that exact moment.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <Spot name="search" />
          <h2 className={styles.sectionHead}>What if you have no users yet?</h2>
          <p className={styles.caption}>
            I wasn&rsquo;t sure whether dwic should stop you here and say &ldquo;go talk to someone first&rdquo;.
            It&rsquo;s the purist answer. But I couldn&rsquo;t find any research showing that blocking people works, and
            in practice they&rsquo;d just skip the command and carry on with no empathy step at all.
          </p>
          <p className={styles.caption}>
            So it doesn&rsquo;t block you. There&rsquo;s evidence even with zero users: people talk about their problems
            in public, in app-store reviews of the tools you&rsquo;d compete with, and in forums. dwic can send a research
            agent to look. Every quote has to come with its link, and dwic opens each page to check the quote is really
            there before showing it to you. It&rsquo;s all labelled public, because these are real people but not your
            users, and I&rsquo;d expect reviews and forums to lean towards people with a complaint, so it says that too.
          </p>
          <p className={styles.caption}>
            Then I asked a question I hadn&rsquo;t thought about: who pays for that search? It&rsquo;s you, not dwic. It
            runs on your own Claude account and it&rsquo;s the heaviest part of a session, so dwic tells you before it
            starts and lets you skip it. Tools that spend your money in the background lose trust fast, and empathy for
            the person using your tool counts too.
          </p>
        </section>

        <section className={styles.section}>
          <Spot name="checklist" />
          <h2 className={styles.sectionHead}>What it doesn&rsquo;t do yet</h2>
          <p className={styles.caption}>
            It&rsquo;s early. So far the only person who has used it is the one who built it, which, by its own labels,
            is the weakest kind of evidence there is. It needs designers who didn&rsquo;t build it.
          </p>
          <p className={styles.caption}>
            It also stops short of where Indi Young would take it. It records what people did and asks for the why, but
            it doesn&rsquo;t yet help you listen for reasoning, reactions and guiding principles in your own interview
            notes. That&rsquo;s the next thing I want to build.
          </p>
        </section>

        <section className={styles.section}>
          <Spot name="target" />
          <h2 className={styles.sectionHead}>Why do this in the terminal, with dwic</h2>
          <p className={styles.caption}>
            You can do everything above with a notebook. In practice, I don&rsquo;t, and I suspect you don&rsquo;t
            either. The reasons are the same ones this whole piece is about, and they&rsquo;re what dwic is built around.
          </p>
          <ul className={e.list}>
            <li><strong>You can&rsquo;t see your own assumptions.</strong> That&rsquo;s the curse of knowledge. dwic reads the flow you point it at and lists what the code assumes about people, with the file and line, so you&rsquo;re looking at your decisions as claims instead of as &ldquo;the form&rdquo;.</li>
            <li><strong>You won&rsquo;t push yourself three times.</strong> Asking yourself &ldquo;who, specifically?&rdquo; and then &ldquo;when did you last see it?&rdquo; is easy to skip on your own. dwic asks, follows up, and stops after three so it doesn&rsquo;t wear you out.</li>
            <li><strong>It teaches while it asks.</strong> Every question comes with a &ldquo;Why I&rsquo;m asking&rdquo; line. After a few sessions you start asking these questions before you write the code.</li>
            <li><strong>It won&rsquo;t let a guess pass as a fact.</strong> No invented users or quotes, every point labelled by how it&rsquo;s known, the why left as unknown until the real person tells you, and nothing recorded until you say yes.</li>
            <li><strong>What you learn sticks around and gets used.</strong> It saves to <code>.dwic/EMPATHY.md</code> in your project, so the next session starts from it, and dwic&rsquo;s copy and form commands read it. Copy borrows your users&rsquo; own words. Forms flag a field your evidence contradicts and leave the call to you.</li>
            <li><strong>It&rsquo;s where you&rsquo;re already building.</strong> No separate research tool, no switching context. It runs in the same Claude Code session as your code, on one flow at a time.</li>
          </ul>
          <p className={styles.caption}>dwic is free as a Claude Code plugin. In Claude Code:</p>
          <pre className={styles.code}>{`/plugin marketplace add imsaif/design-with-claude
/plugin install design-with-claude@design-with-claude
/reload-plugins`}</pre>
          <p className={styles.caption}>
            Then point it at one flow: <code>/design-with-claude:design-empathy the signup flow</code>. What you confirm
            is saved in <code>.dwic/EMPATHY.md</code>, and dwic&rsquo;s copy and form commands read it when they write.
          </p>
          <p className={styles.caption}>If you try it, I&rsquo;d really like to hear where it felt wrong.</p>
        </section>

        <div className={styles.method}>
          <h3>Sources</h3>
          <ul className={e.list}>
            <li>Anthropic, <em>AI Fluency for Builders</em>, &ldquo;The Builder&rsquo;s Toolkit&rdquo;. <a href="https://anthropic-partners.skilljar.com/path/claude-architect/ai-fluency-for-builders/486159" {...ext}>anthropic-partners.skilljar.com</a> (partner sign-in may be required)</li>
            <li>Indi Young (2015), A New Way to Listen, A List Apart, from <em>Practical Empathy</em>. <a href="https://alistapart.com/article/a-new-way-to-listen" {...ext}>alistapart.com</a></li>
            <li>Webb and Sheeran (2006), Does changing behavioral intentions engender behavior change? <a href="https://eprints.whiterose.ac.uk/1580" {...ext}>eprints.whiterose.ac.uk</a></li>
            <li>Nielsen Norman Group, Synthetic Users vs Human Respondents. <a href="https://www.nngroup.com/articles/synthetic-users-vs-human-respondents/" {...ext}>nngroup.com</a></li>
            <li>Nielsen Norman Group, Synthetic Users: If, When, and How to Use AI-Generated &ldquo;Research&rdquo;. <a href="https://www.nngroup.com/articles/synthetic-users/" {...ext}>nngroup.com</a></li>
            <li>Chapman and Milham (2006), The personas&rsquo; new clothes. <a href="https://quantuxbook.com/papers/Chapman-Milham-Personas-HFES2006-0139-0330.pdf" {...ext}>quantuxbook.com</a></li>
            <li>Matthews, Judge and Whittaker (CHI 2012), How do designers and UX professionals actually perceive and use personas? <a href="https://research.google/pubs/how-do-designers-and-user-experience-professionals-actually-perceive-and-use-personas/" {...ext}>research.google</a></li>
            <li>Chip Heath and Dan Heath (2006), The Curse of Knowledge, Harvard Business Review, on Elizabeth Newton&rsquo;s 1990 tapping study. <a href="https://hbr.org/2006/12/the-curse-of-knowledge" {...ext}>hbr.org</a></li>
            <li>Camerer, Loewenstein and Weber (1989), The curse of knowledge in economic settings. <a href="https://doi.org/10.1086/261651" {...ext}>doi.org</a></li>
            <li>Advait Sarkar (2024), AI Should Challenge, Not Obey. <a href="https://arxiv.org/html/2411.02263v2" {...ext}>arxiv.org</a></li>
            <li>Illustrations: <a href="https://github.com/svatsa159/react-doodle-icons" {...ext}>react-doodle-icons</a> (MIT).</li>
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
}
