import { useState } from "react";
import { MLB_TEAMS } from "../constants";
import PitcherStats from "./PitcherStats";
import CombinedPitchMovementPlot from "./CombinedPitchMovementPlot";
import CombinedStrikeZonePlot from "./CombinedStrikeZonePlot";
import PitchSummaryTable from "./PitchSummaryTable";

/**
 * Free-agent starter comparison against FA starters/relievers or MLB team SP/RP.
 */
export default function FreeAgentsTab({
  freeAgentPitchers,
  freeAgentReliefPitchers,
  selectedFreeAgentId,
  setSelectedFreeAgentId,
  comparisonType,
  setComparisonType,
  selectedSecondFreeAgentId,
  setSelectedSecondFreeAgentId,
  selectedTeam,
  setSelectedTeam,
  teamPitchers,
  selectedTeamPitcherId,
  setSelectedTeamPitcherId,
  summary,
  comparisonSummary,
  error,
}) {
  const [plotType, setPlotType] = useState("strikeZone");

  const faName =
    freeAgentPitchers.find(
      (p) => String(p.pitcher_id) === String(selectedFreeAgentId)
    )?.name || "Free agent";

  const isFaStarterCompare = comparisonType === "freeAgent";
  const isFaRelieverCompare = comparisonType === "freeAgentReliever";
  const isTeamCompare =
    comparisonType === "teamStarter" || comparisonType === "teamReliever";

  const compareName = isFaStarterCompare
    ? freeAgentPitchers.find(
        (p) => String(p.pitcher_id) === String(selectedSecondFreeAgentId)
      )?.name || "Free agent"
    : isFaRelieverCompare
      ? freeAgentReliefPitchers.find(
          (p) => String(p.pitcher_id) === String(selectedSecondFreeAgentId)
        )?.name || "Free agent"
      : teamPitchers.find(
          (p) => String(p.pitcher_id) === String(selectedTeamPitcherId)
        )?.name || "Team pitcher";

  const faComparePool = isFaRelieverCompare
    ? freeAgentReliefPitchers
    : freeAgentPitchers;

  return (
    <section className="panel">
      <p className="tab-intro">
        Compare a 2025 free-agent starting pitcher to another free-agent
        starter or reliever, or to any MLB team starter or reliever.
      </p>

      <label className="picker-label">
        Free agent starter
        <select
          className="pitcher-select"
          value={selectedFreeAgentId}
          onChange={(e) => setSelectedFreeAgentId(e.target.value)}
        >
          <option value="">– Choose a free agent starting pitcher –</option>
          {freeAgentPitchers.map((p) => (
            <option key={p.pitcher_id} value={p.pitcher_id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="picker-row" style={{ marginTop: "1rem" }}>
        <label className="picker-label">
          Compare with
          <select
            className="pitcher-select"
            value={comparisonType || ""}
            onChange={(e) => {
              setComparisonType(e.target.value);
              setSelectedSecondFreeAgentId("");
              setSelectedTeamPitcherId("");
              setSelectedTeam("");
            }}
          >
            <option value="">– Choose –</option>
            <option value="freeAgent">Another free agent starter</option>
            <option value="freeAgentReliever">Free agent reliever</option>
            <option value="teamStarter">MLB team starter</option>
            <option value="teamReliever">MLB team reliever</option>
          </select>
        </label>

        {(isFaStarterCompare || isFaRelieverCompare) && (
          <label className="picker-label">
            {isFaRelieverCompare ? "Free agent reliever" : "Second free agent"}
            <select
              className="pitcher-select"
              value={selectedSecondFreeAgentId}
              onChange={(e) => setSelectedSecondFreeAgentId(e.target.value)}
            >
              <option value="">– Choose –</option>
              {faComparePool
                .filter(
                  (p) => String(p.pitcher_id) !== String(selectedFreeAgentId)
                )
                .map((p) => (
                  <option key={p.pitcher_id} value={p.pitcher_id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        )}

        {isTeamCompare && (
          <>
            <label className="picker-label">
              Team
              <select
                className="pitcher-select"
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedTeamPitcherId("");
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
              {comparisonType === "teamReliever"
                ? "Team reliever"
                : "Team starter"}
              <select
                className="pitcher-select"
                value={selectedTeamPitcherId}
                onChange={(e) => setSelectedTeamPitcherId(e.target.value)}
                disabled={!selectedTeam}
              >
                <option value="">– Choose –</option>
                {teamPitchers.map((p) => (
                  <option key={p.pitcher_id} value={p.pitcher_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {error && <div className="error-text">{error}</div>}

      {summary.length > 0 && comparisonSummary.length > 0 && (
        <div style={{ marginTop: "2rem", marginBottom: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.75rem" }}>
            Choose the <strong>Strike Zone</strong> plot or the{" "}
            <strong>Movement</strong> plot to compare arsenals.
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

      {summary.length > 0 && comparisonSummary.length > 0 && (
        <>
          {plotType === "strikeZone" ? (
            <CombinedStrikeZonePlot
              summary1={summary}
              summary2={comparisonSummary}
              pitcher1Name={faName}
              pitcher2Name={compareName}
            />
          ) : (
            <CombinedPitchMovementPlot
              summary1={summary}
              summary2={comparisonSummary}
              pitcher1Name={faName}
              pitcher2Name={compareName}
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
              <h3 style={{ marginBottom: "0.5rem" }}>{faName}</h3>
              <PitcherStats summary={summary} />
              <PitchSummaryTable summary={summary} />
            </div>
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>{compareName}</h3>
              <PitcherStats summary={comparisonSummary} />
              <PitchSummaryTable summary={comparisonSummary} />
            </div>
          </div>
        </>
      )}

      {summary.length > 0 && comparisonSummary.length === 0 && (
        <>
          <PitcherStats summary={summary} />
          <PitchSummaryTable summary={summary} />
        </>
      )}
    </section>
  );
}
