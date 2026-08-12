import { useState } from "react";
import { MLB_TEAMS } from "../constants";
import PitcherStats from "./PitcherStats";
import CombinedPitchMovementPlot from "./CombinedPitchMovementPlot";
import CombinedStrikeZonePlot from "./CombinedStrikeZonePlot";
import PitchSummaryTable from "./PitchSummaryTable";
import PitchMovementPlot from "./PitchMovementPlot";
import StrikeZonePlot from "./StrikeZonePlot";

/**
 * Browse any 2025 MLB team pitcher and optionally compare to another
 * team starter or reliever.
 */
export default function TeamPitchersTab({
  selectedTeam,
  setSelectedTeam,
  selectedRole,
  setSelectedRole,
  teamPitchers,
  selectedPitcherId,
  setSelectedPitcherId,
  comparisonType,
  setComparisonType,
  compareTeam,
  setCompareTeam,
  compareTeamPitchers,
  selectedCompareId,
  setSelectedCompareId,
  summary,
  comparisonSummary,
  error,
}) {
  const [plotType, setPlotType] = useState("strikeZone");

  const isTeamCompare =
    comparisonType === "team_starter" || comparisonType === "team_reliever";

  const pitcherLabel =
    teamPitchers.find((p) => String(p.pitcher_id) === String(selectedPitcherId))
      ?.name || "Team pitcher";

  const compareLabel =
    compareTeamPitchers.find(
      (p) => String(p.pitcher_id) === String(selectedCompareId)
    )?.name || "Comparison pitcher";

  return (
    <section className="panel">
      <p className="tab-intro">
        Pick a 2025 team pitcher (starter if ≥50% of appearances were starts),
        then optionally compare their arsenal to another MLB starter or
        reliever.
      </p>

      <div className="picker-row">
        <label className="picker-label">
          Team
          <select
            className="pitcher-select"
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setSelectedPitcherId("");
            }}
          >
            <option value="">– Choose a team –</option>
            {MLB_TEAMS.map((t) => (
              <option key={t.abbrev} value={t.abbrev}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="picker-label">
          Role
          <select
            className="pitcher-select"
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setSelectedPitcherId("");
            }}
          >
            <option value="starter">Starting pitchers</option>
            <option value="reliever">Relief pitchers</option>
          </select>
        </label>

        <label className="picker-label">
          Pitcher
          <select
            className="pitcher-select"
            value={selectedPitcherId}
            onChange={(e) => setSelectedPitcherId(e.target.value)}
            disabled={!selectedTeam}
          >
            <option value="">– Choose a pitcher –</option>
            {teamPitchers.map((p) => (
              <option key={p.pitcher_id} value={p.pitcher_id}>
                {p.name} ({p.games_started}/{p.appearances} GS, {p.pitch_count}{" "}
                pitches)
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="picker-row" style={{ marginTop: "0.75rem" }}>
        <label className="picker-label">
          Compare with
          <select
            className="pitcher-select"
            value={comparisonType}
            onChange={(e) => {
              setComparisonType(e.target.value);
              setSelectedCompareId("");
              setCompareTeam("");
            }}
          >
            <option value="">– None –</option>
            <option value="team_starter">MLB team starter</option>
            <option value="team_reliever">MLB team reliever</option>
          </select>
        </label>

        {isTeamCompare && (
          <label className="picker-label">
            Comparison team
            <select
              className="pitcher-select"
              value={compareTeam}
              onChange={(e) => {
                setCompareTeam(e.target.value);
                setSelectedCompareId("");
              }}
            >
              <option value="">– Choose a team –</option>
              {MLB_TEAMS.map((t) => (
                <option key={t.abbrev} value={t.abbrev}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {isTeamCompare && (
          <label className="picker-label">
            Comparison pitcher
            <select
              className="pitcher-select"
              value={selectedCompareId}
              onChange={(e) => setSelectedCompareId(e.target.value)}
              disabled={!compareTeam}
            >
              <option value="">– Choose –</option>
              {compareTeamPitchers
                .filter(
                  (p) => String(p.pitcher_id) !== String(selectedPitcherId)
                )
                .map((p) => (
                  <option key={p.pitcher_id} value={p.pitcher_id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>

      {error && <div className="error-text">{error}</div>}

      {summary.length > 0 && comparisonSummary.length > 0 && (
        <div style={{ marginTop: "1.5rem", marginBottom: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.75rem" }}>
            Choose <strong>Strike Zone</strong> for average plate locations, or{" "}
            <strong>Movement</strong> for horizontal / induced vertical break.
          </p>
          <label style={{ fontSize: "0.95rem", marginRight: "0.5rem" }}>
            Plot type:
          </label>
          <select
            value={plotType}
            onChange={(e) => setPlotType(e.target.value)}
            style={{
              padding: "0.5rem",
              fontSize: "0.9rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="strikeZone">Strike Zone</option>
            <option value="movement">Movement</option>
          </select>
        </div>
      )}

      {summary.length > 0 && comparisonSummary.length > 0 ? (
        <>
          {plotType === "strikeZone" ? (
            <CombinedStrikeZonePlot
              summary1={summary}
              summary2={comparisonSummary}
              pitcher1Name={pitcherLabel}
              pitcher2Name={compareLabel}
            />
          ) : (
            <CombinedPitchMovementPlot
              summary1={summary}
              summary2={comparisonSummary}
              pitcher1Name={pitcherLabel}
              pitcher2Name={compareLabel}
            />
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              marginTop: "2rem",
            }}
          >
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>{pitcherLabel}</h3>
              <PitcherStats summary={summary} />
              <PitchSummaryTable summary={summary} />
            </div>
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>{compareLabel}</h3>
              <PitcherStats summary={comparisonSummary} />
              <PitchSummaryTable summary={comparisonSummary} />
            </div>
          </div>
        </>
      ) : (
        summary.length > 0 && (
          <>
            <div style={{ marginTop: "1.5rem", marginBottom: "1rem", textAlign: "center" }}>
              <label style={{ fontSize: "0.95rem", marginRight: "0.5rem" }}>
                Plot type:
              </label>
              <select
                value={plotType}
                onChange={(e) => setPlotType(e.target.value)}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="strikeZone">Strike Zone</option>
                <option value="movement">Movement</option>
              </select>
            </div>
            <PitcherStats summary={summary} />
            {plotType === "strikeZone" ? (
              <StrikeZonePlot summary={summary} />
            ) : (
              <PitchMovementPlot summary={summary} />
            )}
            <PitchSummaryTable summary={summary} />
          </>
        )
      )}
    </section>
  );
}
