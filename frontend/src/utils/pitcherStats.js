// Helper function to calculate pitcher stats
export function calculatePitcherStats(summary) {
  if (!summary || summary.length === 0) {
    return null;
  }

  // Most used pitch (highest usage_pct)
  const mostUsed = summary.reduce((max, pitch) => {
    const usage = pitch.usage_pct ?? 0;
    const maxUsage = max.usage_pct ?? 0;
    return usage > maxUsage ? pitch : max;
  }, summary[0]);

  // Hardest pitch (highest avg_speed, excluding NULL)
  const hardest = summary
    .filter((p) => p.avg_speed !== null && p.avg_speed !== undefined)
    .reduce((max, pitch) => {
      return pitch.avg_speed > max.avg_speed ? pitch : max;
    }, summary.find((p) => p.avg_speed !== null && p.avg_speed !== undefined));

  // Soft contact pitch (lowest avg_hit_exit_speed, excluding NULL)
  const softContact = summary
    .filter((p) => p.avg_hit_exit_speed !== null && p.avg_hit_exit_speed !== undefined)
    .reduce((min, pitch) => {
      return pitch.avg_hit_exit_speed < min.avg_hit_exit_speed ? pitch : min;
    }, summary.find((p) => p.avg_hit_exit_speed !== null && p.avg_hit_exit_speed !== undefined));

  return { mostUsed, hardest, softContact };
}

