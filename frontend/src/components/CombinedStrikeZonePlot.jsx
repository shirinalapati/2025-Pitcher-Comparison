import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import React from "react";

// Custom shape component that renders a circle with a number inside
const NumberedCircle = (props) => {
  const { cx, cy, fill, payload } = props;
  const number = payload?.pitchNumber || "";
  const radius = 10;
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={fill} stroke="#fff" strokeWidth={2} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize="10"
        fontWeight="bold"
      >
        {number}
      </text>
    </g>
  );
};

// Combined Strike Zone Plot - shows both pitchers on one plot
export default function CombinedStrikeZonePlot({ summary1, summary2, pitcher1Name, pitcher2Name }) {
  if ((!summary1 || summary1.length === 0) && (!summary2 || summary2.length === 0)) {
    return null;
  }

  // One color per pitcher
  const pitcher1Color = "#3498db"; // Blue
  const pitcher2Color = "#e74c3c"; // Red

  // Strike zone dimensions (in feet)
  const strikeZoneLeft = -0.708;
  const strikeZoneRight = 0.708;
  const strikeZoneBottom = 1.5;
  const strikeZoneTop = 3.5;

  // Prepare data for pitcher 1 (Free Agent) with pitch numbers
  const filteredPitches1 = (summary1 && Array.isArray(summary1))
    ? summary1.filter((p) => 
        p.avg_plate_location_side !== null && 
        p.avg_plate_location_side !== undefined &&
        p.avg_plate_location_height !== null &&
        p.avg_plate_location_height !== undefined &&
        p.pitch_type !== null && 
        p.pitch_type !== "NULL" && 
        p.pitch_type !== "unspecified"
      )
    : [];

  // Assign numbers to pitch types for pitcher 1
  const pitchNumberMap1 = {};
  filteredPitches1.forEach((pitch, index) => {
    if (!pitchNumberMap1[pitch.pitch_type]) {
      pitchNumberMap1[pitch.pitch_type] = Object.keys(pitchNumberMap1).length + 1;
    }
  });

  const plotData1 = filteredPitches1.map((pitch) => ({
    name: pitch.pitch_type,
    x: pitch.avg_plate_location_side,
    y: pitch.avg_plate_location_height,
    usage: pitch.usage_pct || 0,
    speed: pitch.avg_speed || 0,
    pitcher: pitcher1Name || "Free Agent",
    pitcherGroup: "freeAgent",
    pitchNumber: pitchNumberMap1[pitch.pitch_type]
  }));

  // Prepare data for pitcher 2 with pitch numbers
  const filteredPitches2 = (summary2 && Array.isArray(summary2))
    ? summary2.filter((p) => 
        p.avg_plate_location_side !== null && 
        p.avg_plate_location_side !== undefined &&
        p.avg_plate_location_height !== null &&
        p.avg_plate_location_height !== undefined &&
        p.pitch_type !== null && 
        p.pitch_type !== "NULL" && 
        p.pitch_type !== "unspecified"
      )
    : [];

  // Assign numbers to pitch types for pitcher 2
  const pitchNumberMap2 = {};
  filteredPitches2.forEach((pitch, index) => {
    if (!pitchNumberMap2[pitch.pitch_type]) {
      pitchNumberMap2[pitch.pitch_type] = Object.keys(pitchNumberMap2).length + 1;
    }
  });

  const plotData2 = filteredPitches2.map((pitch) => ({
    name: pitch.pitch_type,
    x: pitch.avg_plate_location_side,
    y: pitch.avg_plate_location_height,
    usage: pitch.usage_pct || 0,
    speed: pitch.avg_speed || 0,
    pitcher: pitcher2Name || "Comparison",
    pitcherGroup: "comparison",
    pitchNumber: pitchNumberMap2[pitch.pitch_type]
  }));

  const combinedPlotData = [...plotData1, ...plotData2];

  if (combinedPlotData.length === 0) {
    return null;
  }

  // Get unique pitch types with numbers for each pitcher's legend
  const uniquePitches1 = plotData1.reduce((acc, point) => {
    const existing = acc.find(p => p.name === point.name);
    if (!existing) {
      acc.push({
        name: point.name,
        number: point.pitchNumber
      });
    }
    return acc;
  }, []).sort((a, b) => a.number - b.number);

  const uniquePitches2 = plotData2.reduce((acc, point) => {
    const existing = acc.find(p => p.name === point.name);
    if (!existing) {
      acc.push({
        name: point.name,
        number: point.pitchNumber
      });
    }
    return acc;
  }, []).sort((a, b) => a.number - b.number);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPayload = payload.find(p => p.payload && p.payload.x !== undefined && p.payload.y !== undefined) || payload[0];

      if (!dataPayload || !dataPayload.payload) return null;

      const data = dataPayload.payload;
      const pitcherName = data.pitcher || "Unknown";

      return (
        <div style={{
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>{pitcherName}</p>
          <p style={{ margin: "4px 0 0 0", fontWeight: "600" }}>{data.name}</p>
          <p style={{ margin: "4px 0 0 0" }}>Side: {data.x.toFixed(2)} ft</p>
          <p style={{ margin: "4px 0 0 0" }}>Height: {data.y.toFixed(2)} ft</p>
          <p style={{ margin: "4px 0 0 0" }}>Usage: {data.usage.toFixed(1)}%</p>
          <p style={{ margin: "4px 0 0 0" }}>Speed: {data.speed.toFixed(1)} mph</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ marginTop: "2rem", marginBottom: "2rem", textAlign: "center" }}>
      <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600", textAlign: "center" }}>
        Strike Zone Comparison
      </h3>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem", textAlign: "center" }}>
        Average pitch location at plate - Blue circles: {pitcher1Name || "Pitcher 1"}, Red circles: {pitcher2Name || "Pitcher 2"}
      </p>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height={550}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Side Location"
              label={{ value: "Side (ft)", position: "insideBottom", offset: -5 }}
              domain={[-2, 2]}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Height"
              label={{ value: "Height (ft)", angle: -90, position: "insideLeft" }}
              domain={[0, 5]}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Strike zone reference lines */}
            <ReferenceLine y={strikeZoneTop} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
            <ReferenceLine y={strikeZoneBottom} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
            <ReferenceLine x={strikeZoneLeft} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
            <ReferenceLine x={strikeZoneRight} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
            <Scatter
              name="Combined Pitches"
              data={combinedPlotData}
              dataKey="x"
              shape={<NumberedCircle />}
            >
              {combinedPlotData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pitcherGroup === "freeAgent" ? pitcher1Color : pitcher2Color}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        {/* Pitcher 1 Legend */}
        {uniquePitches1.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem", textAlign: "center" }}>
              {pitcher1Name || "Pitcher 1"} Pitch Types (Blue):
            </div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "0.85rem",
              justifyContent: "center"
            }}>
              {uniquePitches1.map((pitch, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: pitcher1Color,
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "bold"
                  }}>
                    {pitch.number}
                  </div>
                  <span>{pitch.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pitcher 2 Legend */}
        {uniquePitches2.length > 0 && (
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem", textAlign: "center" }}>
              {pitcher2Name || "Pitcher 2"} Pitch Types (Red):
            </div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "0.85rem",
              justifyContent: "center"
            }}>
              {uniquePitches2.map((pitch, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: pitcher2Color,
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "bold"
                  }}>
                    {pitch.number}
                  </div>
                  <span>{pitch.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

