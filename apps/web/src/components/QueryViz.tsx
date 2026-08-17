import type { ReactNode } from "react";
import type { VizPayload } from "../lib/types";
import { inferChartSpec, type ChartSpec } from "../lib/chartSpec";
import {
  chartSubtitle,
  chartTitle,
  formatAxisLabel,
  formatCell,
  formatKpiValue,
  formatMetricLabel,
  metricColumns,
  readCssVar,
  seriesColor,
} from "../lib/viz";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = { viz: VizPayload };

function VizFrame({
  title,
  subtitle,
  children,
  table,
}: {
  title: string;
  subtitle: string | null;
  children: ReactNode;
  table: ReactNode;
}) {
  return (
    <section className="viz-panel" aria-label={`Chart: ${title}`}>
      <header className="viz-header">
        <h3 className="viz-title">{title}</h3>
        {subtitle ? <p className="viz-subtitle">{subtitle}</p> : null}
      </header>
      <div className="viz-chart">{children}</div>
      {table}
    </section>
  );
}

function DataTable({ viz }: Props) {
  const maxRows = 12;
  const shown = viz.rows.slice(0, maxRows);
  return (
    <div className="viz-table-wrap">
      <table className="viz-table">
        <caption className="viz-table-caption">
          Query result
          {viz.truncated ? " (truncated for display)" : ""}
        </caption>
        <thead>
          <tr>
            {viz.columns.map((col) => (
              <th key={col} scope="col">
                {formatAxisLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row, i) => (
            <tr key={i}>
              {viz.columns.map((_, j) => (
                <td key={j}>{formatCell(row[j] ?? null)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {viz.rows.length > maxRows ? (
        <p className="viz-footnote">{viz.rows.length - maxRows} more rows not shown in table.</p>
      ) : null}
    </div>
  );
}

const tooltipStyle = {
  background: "var(--surface)",
  border: "0.5px solid var(--separator)",
  borderRadius: "10px",
  fontSize: "12px",
};

function KpiView({ viz }: Props) {
  const metrics = metricColumns(viz);
  const row = viz.rows[0] ?? [];
  return (
    <VizFrame title={chartTitle(viz)} subtitle={chartSubtitle(viz)} table={<DataTable viz={viz} />}>
      <div className="viz-kpi-grid">
        {metrics.map((metric) => {
          const idx = viz.columns.indexOf(metric);
          const value = idx >= 0 ? row[idx] ?? null : null;
          return (
            <div key={metric} className="viz-kpi">
              <span className="viz-kpi-label">{formatMetricLabel(metric)}</span>
              <span className="viz-kpi-value">{formatKpiValue(value)}</span>
            </div>
          );
        })}
      </div>
    </VizFrame>
  );
}

function LineChartView({ viz, spec }: { viz: VizPayload; spec: Extract<ChartSpec, { kind: "line" }> }) {
  const grid = readCssVar("--separator", "oklch(0.88 0.03 88)");
  const fg = readCssVar("--fg-secondary", "oklch(0.45 0.04 88)");

  return (
    <VizFrame title={chartTitle(viz)} subtitle={chartSubtitle(viz)} table={<DataTable viz={viz} />}>
      <ResponsiveContainer width="100%" height={spec.height}>
        <LineChart data={spec.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={spec.xKey}
            tick={{ fill: fg, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: grid }}
          />
          <YAxis
            tick={{ fill: fg, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCell(typeof v === "number" ? v : Number(v))}
            width={56}
          />
          <Tooltip
            formatter={(value) => formatCell(typeof value === "number" ? value : Number(value))}
            labelFormatter={(label) => String(label)}
            contentStyle={tooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {spec.series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={seriesColor(i)}
              strokeWidth={2}
              dot={spec.connectNulls ? { r: 3 } : false}
              activeDot={{ r: 4 }}
              connectNulls={spec.connectNulls}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </VizFrame>
  );
}

function BarChartView({ viz, spec }: { viz: VizPayload; spec: Extract<ChartSpec, { kind: "bar" }> }) {
  const grid = readCssVar("--separator", "oklch(0.88 0.03 88)");
  const fg = readCssVar("--fg-secondary", "oklch(0.45 0.04 88)");

  return (
    <VizFrame title={chartTitle(viz)} subtitle={chartSubtitle(viz)} table={<DataTable viz={viz} />}>
      <ResponsiveContainer width="100%" height={spec.height}>
        <BarChart
          data={spec.data}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid stroke={grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: fg, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: grid }}
            tickFormatter={(v) => formatCell(typeof v === "number" ? v : Number(v))}
          />
          <YAxis
            type="category"
            dataKey={spec.categoryKey}
            width={48}
            tick={{ fill: fg, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatCell(typeof value === "number" ? value : Number(value))}
            contentStyle={tooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {spec.metrics.map((metric, i) => (
            <Bar
              key={metric}
              dataKey={metric}
              name={formatMetricLabel(metric)}
              fill={seriesColor(i)}
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </VizFrame>
  );
}

function TableOnlyView({ viz }: Props) {
  return (
    <VizFrame title={chartTitle(viz)} subtitle={chartSubtitle(viz)} table={null}>
      <DataTable viz={viz} />
    </VizFrame>
  );
}

export default function QueryViz({ viz }: Props) {
  const spec = inferChartSpec(viz);
  switch (spec.kind) {
    case "kpi":
      return <KpiView viz={viz} />;
    case "line":
      return <LineChartView viz={viz} spec={spec} />;
    case "bar":
      return <BarChartView viz={viz} spec={spec} />;
    default:
      return <TableOnlyView viz={viz} />;
  }
}
