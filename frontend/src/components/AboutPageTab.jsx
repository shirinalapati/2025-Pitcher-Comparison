export default function AboutPageTab() {
  return (
    <section className="panel">
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          lineHeight: "1.8",
          fontSize: "1rem",
          textAlign: "left",
        }}
      >
        <p style={{ marginBottom: "1.5rem" }}>
          <strong>PitcherIQ</strong> is an MLB pitcher comparison and arsenal
          analysis platform built on public 2025 Statcast pitch data. Use it to
          select pitchers, compare arsenals, inspect pitch location and
          movement, and dig into the underlying metrics — across all 30 MLB
          teams and the 2025 free-agent class.
        </p>

        <p style={{ marginBottom: "1.5rem" }}>
          The app has five tabs: <strong>About</strong>,{" "}
          <strong>Team Pitchers</strong>, <strong>Free Agent Starters</strong>,{" "}
          <strong>Free Agent Relievers</strong>, and <strong>Stuff Score</strong>.
        </p>

        <p style={{ marginBottom: "1.5rem" }}>
          <strong>Team Pitchers</strong> lets you pick any of the 30 MLB teams,
          choose starters or relievers, and inspect a pitcher&apos;s 2025
          repertoire (usage, velocity, horizontal/induced vertical break, spin,
          exit velocity, launch angle, and average plate location). Pitchers are
          classified as starters when at least 50% of their appearances were
          games started (first pitcher for their team in a game); otherwise they
          are treated as relievers. A minimum pitch sample keeps noisy cameos out
          of the dropdowns. You can compare a team pitcher to another MLB
          starter or reliever (any team) with side-by-side tables and combined
          strike-zone / movement plots.
        </p>

        <p style={{ marginBottom: "1.5rem" }}>
          <strong>Free Agent Starters</strong> and{" "}
          <strong>Free Agent Relievers</strong> focus on the 2025 free-agent
          market as one evaluation lens within PitcherIQ. Compare across free
          agents (starter or reliever) and MLB team pitchers in either role.
          Blue / red numbered markers distinguish the two arsenals on the
          comparison plots.
        </p>

        <p style={{ marginBottom: "1.5rem" }}>
          <strong>Stuff Score</strong> ranks free-agent starters, free-agent
          relievers, and league-wide 2025 starters / relievers using a
          usage-weighted, within-group Z-score model of velocity, spin, movement,
          and contact quality. Details and weights are explained on that tab.
        </p>

        <p style={{ marginBottom: "1.5rem" }}>
          Pitch data is rebuilt from the public Hugging Face Statcast dump
          (`Jensen-holm/statcast-era-pitches`) via{" "}
          <code>scripts/build_db.py</code>.
        </p>
      </div>
    </section>
  );
}
