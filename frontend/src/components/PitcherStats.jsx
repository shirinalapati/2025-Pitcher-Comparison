import { calculatePitcherStats } from "../utils/pitcherStats";

// Component to display pitcher stats
export default function PitcherStats({ summary }) {
  const stats = calculatePitcherStats(summary);
  
  if (!stats) {
    return null;
  }

  const fmt = (v, digits = 1) =>
    v === null || v === undefined ? "Unspecified" : v.toFixed(digits);

  return (
    <div style={{ 
      marginBottom: "1rem", 
      padding: "0.75rem", 
      backgroundColor: "#f5f5f5", 
      borderRadius: "4px",
      fontSize: "0.95rem",
      textAlign: "center"
    }}>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        {stats.mostUsed && (
          <span>
              <strong>Most Used:</strong> {stats.mostUsed.pitch_type || "Unspecified"} ({fmt(stats.mostUsed.usage_pct)}%)
            </span>
          )}
          {stats.hardest && (
            <span>
              <strong>Hardest Pitch:</strong> {stats.hardest.pitch_type || "Unspecified"} ({fmt(stats.hardest.avg_speed)} mph)
            </span>
          )}
          {stats.softContact && (
            <span>
              <strong>Soft Contact Pitch:</strong> {stats.softContact.pitch_type || "Unspecified"} (avg Hit Exit Speed: {fmt(stats.softContact.avg_hit_exit_speed)} mph)
          </span>
        )}
      </div>
    </div>
  );
}

