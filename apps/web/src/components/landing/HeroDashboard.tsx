/** Hero product preview: single contained analytics + chat mock. */
export default function HeroDashboard() {
  return (
    <div className="hero-stage" aria-hidden>
      <div className="hero-stage-frame">
        <header className="hero-stage-header">
          <span className="landing-preview-dot" />
          <span className="landing-preview-dot" />
          <span className="landing-preview-dot" />
          <span className="hero-stage-title">Analytics workspace</span>
          <span className="hero-stage-soon">Viz &amp; dashboards — coming soon</span>
        </header>

        <div className="hero-stage-body">
          <div className="hero-kpi-row">
            <div className="hero-kpi">
              <span className="hero-kpi-label">Revenue</span>
              <span className="hero-kpi-value">$2.4M</span>
              <span className="hero-kpi-delta">+12.4%</span>
            </div>
            <div className="hero-kpi">
              <span className="hero-kpi-label">Active users</span>
              <span className="hero-kpi-value">18.2k</span>
              <span className="hero-kpi-delta">+3.1%</span>
            </div>
          </div>

          <svg className="hero-stage-chart" viewBox="0 0 360 96" fill="none">
            <line className="hero-chart-grid" x1="0" y1="76" x2="360" y2="76" />
            <line className="hero-chart-grid" x1="0" y1="48" x2="360" y2="48" />
            <line className="hero-chart-grid" x1="0" y1="20" x2="360" y2="20" />
            <rect className="hero-bar" x="20" y="54" width="24" height="22" rx="4" />
            <rect className="hero-bar" x="58" y="40" width="24" height="36" rx="4" />
            <rect className="hero-bar" x="96" y="28" width="24" height="48" rx="4" />
            <rect className="hero-bar" x="134" y="36" width="24" height="40" rx="4" />
            <rect className="hero-bar" x="172" y="22" width="24" height="54" rx="4" />
            <rect className="hero-bar" x="210" y="32" width="24" height="44" rx="4" />
            <path
              className="hero-line"
              d="M32 50 L66 44 L104 36 L142 42 L180 26 L218 32 L256 20"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="hero-stage-chat">
            <p className="hero-chat-q">Revenue by quarter last year?</p>
            <p className="hero-chat-a">
              <strong>Q4 led</strong> at $2.4M. Want a regional split?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
