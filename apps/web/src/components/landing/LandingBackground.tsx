/**
 * Ambient page backdrop only: soft grid + corner glows.
 * BI charts and KPIs live in hero/feature components, not here.
 */
export default function LandingBackground() {
  return (
    <div className="landing-atmosphere" aria-hidden>
      <div className="landing-atmosphere-glow landing-atmosphere-glow-tr" />
      <div className="landing-atmosphere-glow landing-atmosphere-glow-bl" />
    </div>
  );
}
