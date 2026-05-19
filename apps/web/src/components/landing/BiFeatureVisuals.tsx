type Variant = "metrics" | "guided" | "transparent";

function MockChrome({ title }: { title: string }) {
  return (
    <header className="feature-mock-chrome">
      <span className="landing-preview-dot" />
      <span className="landing-preview-dot" />
      <span className="landing-preview-dot" />
      <span className="feature-mock-title">{title}</span>
    </header>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12L10 17L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 11V8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8V11"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function MetricsMock() {
  const rows = [
    { name: "Revenue", type: "Sum · USD" },
    { name: "Active users", type: "Count · Daily" },
    { name: "Churn rate", type: "Ratio · %" },
  ];

  return (
    <div className="feature-mock">
      <MockChrome title="Semantic layer" />
      <div className="feature-mock-body">
        <div className="feature-compare-row">
          <span className="feature-compare-bad">
            <IconX /> 400+ table columns in prompt
          </span>
          <span className="feature-compare-good">
            <IconCheck /> 12 governed metrics
          </span>
        </div>
        <ul className="feature-metric-list">
          {rows.map((row) => (
            <li key={row.name}>
              <span className="feature-metric-check" aria-hidden>
                <IconCheck />
              </span>
              <span className="feature-metric-info">
                <span className="feature-metric-name">{row.name}</span>
                <span className="feature-metric-type">{row.type}</span>
              </span>
              <span className="feature-metric-badge">In layer</span>
            </li>
          ))}
        </ul>
        <p className="feature-mock-footnote">
          Single source of truth · viz &amp; dashboards coming soon
        </p>
      </div>
    </div>
  );
}

function GuidedMock() {
  const steps = [
    {
      num: "1",
      label: "Parse question",
      detail: "Who were top customers last quarter?",
    },
    {
      num: "2",
      label: "Pick metrics (agent)",
      detail: "Selects Customer, Revenue, Time from semantic layer",
    },
    {
      num: "3",
      label: "Execute via MCP",
      detail: "Runs metric-layer query through tool call",
    },
    {
      num: "4",
      label: "Return insight",
      detail: "ACME Corp led at $420k, up 8% vs Q2",
    },
  ];

  return (
    <div className="feature-mock">
      <MockChrome title="Agent trace" />
      <div className="feature-mock-body">
        <ol className="feature-flow">
          {steps.map((step, i) => (
            <li key={step.num} className="feature-flow-step">
              <span className="feature-flow-num">{step.num}</span>
              <div className="feature-flow-content">
                <span className="feature-flow-label">{step.label}</span>
                <p className="feature-flow-detail">{step.detail}</p>
              </div>
              {i < steps.length - 1 ? <span className="feature-flow-line" aria-hidden /> : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function TransparentMock() {
  const trace = [
    "Tool: query_metric(revenue, Q4 2024)",
    "Source: semantic layer · deterministic",
    "Result: $2.4M (sum by region)",
  ];

  return (
    <div className="feature-mock">
      <MockChrome title="Query audit" />
      <div className="feature-mock-body">
        <div className="feature-answer-card">
          <p className="feature-answer-label">Assistant</p>
          <p className="feature-answer-text">
            <strong>Q4 revenue</strong> was $2.4M across all regions.
          </p>
        </div>
        <details className="feature-trace" open>
          <summary>How this was answered</summary>
          <ul>
            {trace.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
        <div className="feature-token-row">
          <span className="feature-token-stat">
            <strong>3–5k</strong> tokens
          </span>
          <span className="feature-token-vs">vs 18–28k text-to-SQL</span>
        </div>
        <p className="feature-token-note">Per question · mid-size schema (illustrative)</p>
        <div className="feature-secure-row">
          <IconLock />
          <span>Zero randomness · zero hallucinations</span>
        </div>
      </div>
    </div>
  );
}

export function BiFeatureVisual({ variant }: { variant: Variant }) {
  if (variant === "metrics") return <MetricsMock />;
  if (variant === "guided") return <GuidedMock />;
  return <TransparentMock />;
}
