import { useState } from "react";

function LeaderboardTable({ title, data }) {
  if (!data?.leaderboard?.length) {
    return (
      <p style={{ textAlign: "center", color: "#666" }}>
        Loading {title}…
      </p>
    );
  }
  return (
    <div style={{ marginTop: "2rem", textAlign: "center" }}>
      <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600" }}>
        {title}
      </h3>
      <div className="table-wrapper">
        <table className="summary-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>Rank</th>
              <th style={{ textAlign: "left" }}>Pitcher</th>
              <th style={{ textAlign: "right" }}>Stuff Score</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((pitcher, idx) => (
              <tr key={pitcher.pitcher_id}>
                <td style={{ textAlign: "center" }}>{idx + 1}</td>
                <td style={{ textAlign: "left" }}>{pitcher.name}</td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>
                  {pitcher.stuff_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StuffScoreTab({
  stuffScoreData,
  freeAgentReliefStuffScoreData,
  mlbStartersStuffScoreData,
  mlbRelieversStuffScoreData,
  error,
}) {
  const [selectedLeaderboard, setSelectedLeaderboard] = useState(
    "freeAgentStarters"
  );

  return (
    <section className="panel">
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          What is the Stuff Score?
        </h2>
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "1.5rem",
            borderRadius: "8px",
            lineHeight: "1.6",
            fontSize: "0.95rem",
            textAlign: "left",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            The Stuff Score is a single metric designed to summarize raw pitch
            qualities for free-agent and MLB starting/relief pitchers using
            2025 Statcast pitch-level data. Because each pitcher throws multiple
            pitch types with different movement, velocity, and batted-ball
            outcomes, the score collapses that information into one number that
            can be compared within a group.
          </p>

          <p style={{ marginBottom: "0.5rem" }}>The score uses six components:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li>Average overall velocity</li>
            <li>Total horizontal movement (magnitude)</li>
            <li>Total vertical movement (magnitude)</li>
            <li>Average spin rate</li>
            <li>Average exit velocity allowed</li>
            <li>Average launch angle allowed</li>
          </ul>
          <p style={{ marginBottom: "1.5rem" }}>
            It is not meant to measure command or sequencing — just the physical
            quality of the arsenal and how it tends to affect contact.
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              1. Usage-Weighted Pitch Averages
            </h3>
            <p>
              Each pitcher&apos;s repertoire is summarized into usage-weighted
              averages so more frequently used pitches contribute more. Horizontal
              and vertical break use absolute value so elite movement is rewarded
              regardless of direction.
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              2. Standardizing Across Pitchers
            </h3>
            <p style={{ marginBottom: "0.5rem" }}>
              Stats are converted to Z-scores within each leaderboard group
              (FA starters, FA relievers, MLB starters, MLB relievers):
            </p>
            <p
              style={{
                fontFamily: "monospace",
                backgroundColor: "#e8e8e8",
                padding: "0.5rem",
                borderRadius: "4px",
                marginBottom: "0.5rem",
                textAlign: "center",
              }}
            >
              Z = (value – group mean) / group standard deviation
            </p>
            <p>
              Exit velocity and launch angle are flipped so lower contact quality
              still yields a higher Z.
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              3. Weighted Combination
            </h3>
            <div
              style={{
                fontFamily: "monospace",
                backgroundColor: "#e8e8e8",
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "0.75rem",
                lineHeight: "1.8",
              }}
            >
              StuffScore = 0.25·Z<sub>Speed</sub> + 0.20·Z<sub>Spin</sub> +
              0.20·Z<sub>IVB</sub> + 0.15·Z<sub>HB</sub> + 0.10·Z<sub>EV</sub> +
              0.10·Z<sub>LA</sub>
            </div>
            <p style={{ marginBottom: "0.75rem", fontWeight: "600" }}>
              How I landed on these weights
            </p>
            <p style={{ marginBottom: "0.75rem" }}>
              I didn&apos;t start with a published stuff model — I started with
              the metrics already in each pitcher&apos;s summary table and asked
              what should count most if the goal is raw pitch quality, not
              command or game results. Velocity jumped out first: across the
              pitchers I compared, the biggest separation in &quot;this ball
              looks hard to hit&quot; almost always tracked with higher
              average speed, so I gave it the largest share (25%).
            </p>
            <p style={{ marginBottom: "0.75rem" }}>
              Spin and induced vertical break felt like the next clear pair.
              Higher spin often shows up alongside ride or depth, and large IVB
              (in either direction) is what makes fastballs look &quot;rising&quot;
              and curveballs dig. I tried treating them as slightly less
              important than velocity but still primary stuff signals, which is
              how both settled at 20%. Horizontal break mattered too — sweep and
              arm-side run are real arsenal traits — but it separated pitchers a
              bit less cleanly than velocity/spin/IVB in the samples I looked at,
              so I put it at 15%.
            </p>
            <p style={{ marginBottom: "0.75rem" }}>
              Exit velocity and launch angle allowed are useful checks on whether
              the arsenal tends to produce weaker or less ideal contact, but
              they&apos;re also noisier and more outcome-driven than the pitch
              traits themselves. I kept them in so the score isn&apos;t only
              &quot;pretty movement,&quot; then capped each at 10% so contact
              quality can nudge rankings without overpowering the stuff core.
            </p>
            <p style={{ marginBottom: "0.75rem" }}>
              In short: I ranked the six inputs by how central they felt to
              physical pitch quality, made the weights sum to 1.0, and adjusted
              until the leaderboards matched the arms that looked dominant on
              the movement and velocity plots. These weights are intentional,
              not fitted to a prediction model — a transparent starting point
              for comparing arsenals within each group.
            </p>
            <p>
              Higher Stuff Score means stronger raw stuff relative to that group.
              Lower scores can still describe effective pitchers who rely more on
              command or sequencing.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div style={{ marginTop: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
        <label
          style={{ fontSize: "0.95rem", marginRight: "0.5rem", fontWeight: "600" }}
        >
          Leaderboard:
        </label>
        <select
          value={selectedLeaderboard}
          onChange={(e) => setSelectedLeaderboard(e.target.value)}
          style={{
            padding: "0.5rem",
            fontSize: "0.9rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            minWidth: "280px",
            color: "#111827",
            background: "#ffffff",
          }}
        >
          <option value="freeAgentStarters">Free Agent Starting Pitchers</option>
          <option value="freeAgentRelief">Free Agent Relief Pitchers</option>
          <option value="mlbStarters">MLB Starting Pitchers (2025)</option>
          <option value="mlbRelief">MLB Relief Pitchers (2025)</option>
        </select>
      </div>

      {selectedLeaderboard === "freeAgentStarters" && (
        <LeaderboardTable
          title="Free Agent Starting Pitchers Stuff Score Leaderboard"
          data={stuffScoreData}
        />
      )}
      {selectedLeaderboard === "freeAgentRelief" && (
        <LeaderboardTable
          title="Free Agent Relief Pitchers Stuff Score Leaderboard"
          data={freeAgentReliefStuffScoreData}
        />
      )}
      {selectedLeaderboard === "mlbStarters" && (
        <LeaderboardTable
          title="MLB Starting Pitchers Stuff Score Leaderboard"
          data={mlbStartersStuffScoreData}
        />
      )}
      {selectedLeaderboard === "mlbRelief" && (
        <LeaderboardTable
          title="MLB Relief Pitchers Stuff Score Leaderboard"
          data={mlbRelieversStuffScoreData}
        />
      )}
    </section>
  );
}
