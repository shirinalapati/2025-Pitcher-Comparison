// Reusable table component
export default function PitchSummaryTable({ summary }) {
  if (!summary || summary.length === 0) {
    return null;
  }

  const fmt = (v, digits = 1) =>
    v === null || v === undefined ? "Unspecified" : v.toFixed(digits);

  return (
    <div className="table-wrapper">
      <table className="summary-table">
        <thead>
          <tr>
            <th>Pitch Type</th>
            <th># Pitches</th>
            <th>Usage %</th>
            <th>Avg Speed (mph)</th>
            <th>Avg Horizontal Break (in)</th>
            <th>Avg Induced Vertical Break (in)</th>
            <th>Avg Spin Rate (rpm)</th>
            <th>Avg Hit Exit Speed (mph)</th>
            <th>Avg Hit Launch Angle (°)</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row, idx) => (
            <tr key={idx}>
              <td>{row.pitch_type || "Unspecified"}</td>
              <td>{row.pitch_count ?? "Unspecified"}</td>
              <td>{fmt(row.usage_pct)}</td>
              <td>{fmt(row.avg_speed)}</td>
              <td>{fmt(row.avg_horizontal_break)}</td>
              <td>{fmt(row.avg_induced_vertical_break)}</td>
              <td>{fmt(row.avg_spin_rate)}</td>
              <td>{fmt(row.avg_hit_exit_speed)}</td>
              <td>{fmt(row.avg_hit_launch_angle)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

