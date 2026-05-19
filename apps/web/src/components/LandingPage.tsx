import { BiFeatureVisual } from "./landing/BiFeatureVisuals";
import HeroDashboard from "./landing/HeroDashboard";
import LandingBackground from "./landing/LandingBackground";
import ValueProposition from "./landing/ValueProposition";

interface Props {
  onSignIn: () => void;
  onGetStarted: () => void;
}

function IconSpark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3L13.5 9.5L20 11L13.5 12.5L12 19L10.5 12.5L4 11L10.5 9.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="app-brand-mark" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 16L10 8L14 14L18 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const TRUST_PILLS = [
  "Single source of truth",
  "Zero randomness",
  "Zero hallucinations",
];

export default function LandingPage({ onSignIn, onGetStarted }: Props) {
  return (
    <div className="landing">
      <LandingBackground />

      <header className="landing-nav frosted">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <BrandMark size={28} />
            <span>Graphtic BI</span>
          </div>
          <div className="landing-nav-actions">
            <button type="button" className="btn btn-ghost" onClick={onSignIn}>
              Sign in
            </button>
            <button type="button" className="btn btn-primary" onClick={onGetStarted}>
              Get started
            </button>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <p className="landing-eyebrow">
              <IconSpark />
              Semantic-layer analytics agent
            </p>
            <h1>Governed metrics. Deterministic answers.</h1>
            <p className="landing-hero-lead">
              Ask in plain language. A multistep reasoning agent picks governed metrics from your
              semantic layer, the single source of truth for how your org defines revenue, growth,
              and every KPI. Deterministic queries through MCP tools mean zero randomness in
              retrieval and zero hallucinations in the answer: no improvised SQL, no schema dumps,
              only numbers tied to what was actually queried.
            </p>
            <ul className="landing-trust" aria-label="Product highlights">
              {TRUST_PILLS.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <p className="landing-coming-soon">Visualizations &amp; dashboards — coming soon</p>
            <div className="landing-cta-row">
              <button type="button" className="btn btn-primary" onClick={onGetStarted}>
                Get started
              </button>
            </div>
          </div>
          <div className="landing-hero-visual">
            <HeroDashboard />
          </div>
        </div>
      </section>

      <ValueProposition />

      <section className="landing-features" aria-labelledby="features-heading">
        <h2 id="features-heading">How it works</h2>
        <div className="feature-list">
          <article className="feature-row">
            <div className="feature-copy">
              <h3>One source of truth for every metric</h3>
              <p>
                Chat pulls from governed definitions today; visualizations and dashboards are coming
                soon on the same semantic layer. The model reasons over
                your metric catalog, not hundreds of table columns shoved into context, so everyone
                works from one semantic layer.
              </p>
            </div>
            <div className="feature-visual feature-visual-mock">
              <BiFeatureVisual variant="metrics" />
            </div>
          </article>

          <article className="feature-row feature-row-reverse">
            <div className="feature-copy">
              <h3>Multistep agent, metric-aware tools</h3>
              <p>
                A ReAct-style agent breaks the question into steps, selects the right metrics from
                the semantic layer for each step, and calls MCP tools to execute. It plans before
                it queries.
              </p>
            </div>
            <div className="feature-visual feature-visual-mock">
              <BiFeatureVisual variant="guided" />
            </div>
          </article>

          <article className="feature-row">
            <div className="feature-copy">
              <h3>Zero randomness. Zero hallucinations.</h3>
              <p>
                Every result comes from a metric-layer query executed through tools, not improvised
                SQL or model guesswork. You see exactly which metrics ran, spend less per question,
                and get answers with zero randomness and zero hallucinations.
              </p>
            </div>
            <div className="feature-visual feature-visual-mock">
              <BiFeatureVisual variant="transparent" />
            </div>
          </article>
        </div>
      </section>

      <section className="landing-cta-band">
        <h2>Ready to query metrics, not warehouses?</h2>
        <p className="landing-cta-lead">
          Start with governed definitions and conversational answers today. Visualizations and
          dashboards are coming soon.
        </p>
        <button type="button" className="btn btn-primary" onClick={onGetStarted}>
          Open your workspace
        </button>
      </section>

      <footer className="landing-footer">
        <p>Graphtic BI</p>
        <p className="landing-footer-note">Visualizations &amp; dashboards — coming soon</p>
      </footer>
    </div>
  );
}
