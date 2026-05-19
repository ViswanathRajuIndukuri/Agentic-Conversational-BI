const VALUES = [
  {
    title: "No ad-hoc SQL sprawl",
    description:
      "The agent does not draft hundreds of SQL lines. It selects governed metrics and runs structured lookups.",
  },
  {
    title: "Multistep reasoning agent",
    description:
      "A ReAct-style agent plans each question, picks the right metrics from your semantic layer, then executes tools step by step.",
  },
  {
    title: "Deterministic retrieval",
    description:
      "Data comes back through MCP tool execution and metric-layer queries. Zero randomness in how numbers are fetched.",
  },
  {
    title: "Lean context, lower cost",
    description:
      "No dumping full database schemas into the prompt. Typical questions use a fraction of the tokens text-to-SQL needs on the same data estate.",
  },
  {
    title: "Zero hallucinations",
    description:
      "Answers map only to real query results from approved definitions. The model does not invent metrics, filters, or figures.",
  },
] as const;

export default function ValueProposition() {
  return (
    <section className="landing-value" aria-labelledby="value-heading">
      <div className="landing-value-inner">
        <header className="landing-value-header">
          <h2 id="value-heading">Why teams switch</h2>
          <p>
            Text-to-SQL sends entire schemas to the model and hopes for the best. Graphtic BI routes
            every question through your semantic metric layer, a single source of truth, with
            deterministic tool execution.
          </p>
        </header>
        <ul className="landing-value-grid">
          {VALUES.map((item) => (
            <li key={item.title} className="landing-value-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
