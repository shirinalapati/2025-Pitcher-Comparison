import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// Strike Zone Plot Component
export default function StrikeZonePlot({ summary }) {
  if (!summary || summary.length === 0) {
    return null;
  }

  // Color palette for different pitch types
  const pitchColors = {
    "Fastball": "#e74c3c",
    "4-Seam Fastball": "#e74c3c",
    "Sinker": "#3498db",
    "Slider": "#9b59b6",
    "Curveball": "#2ecc71",
    "ChangeUp": "#f39c12",
    "Changeup": "#f39c12",
    "Cutter": "#e67e22",
    "Splitter": "#1abc9c",
    "Knuckleball": "#34495e",
    "Other": "#95a5a6",
    "NULL": "#7f8c8d"
  };

  // Prepare data for the strike zone plot
  // plate_location_side: negative = left (from pitcher's perspective), positive = right
  // plate_location_height: height in feet (typically 1.5 to 3.5 feet)
  const plotData = summary
    .filter((p) => 
      p.avg_plate_location_side !== null && 
      p.avg_plate_location_side !== undefined &&
      p.avg_plate_location_height !== null &&
      p.avg_plate_location_height !== undefined
    )
    .map((pitch) => ({
      name: pitch.pitch_type || "NULL",
      x: pitch.avg_plate_location_side, // side location in feet
      y: pitch.avg_plate_location_height, // height in feet
      usage: pitch.usage_pct || 0,
      speed: pitch.avg_speed || 0,
    }));

  if (plotData.length === 0) {
    return null;
  }

  // Get unique pitch types with their colors for legend
  const uniquePitches = [...new Set(plotData.map(p => p.name))].map(pitchName => ({
    name: pitchName,
    color: pitchColors[pitchName] || "#95a5a6"
  }));

  // Strike zone dimensions (in feet)
  // Width: -0.708 to +0.708 feet (17 inches / 2 = 8.5 inches on each side, converted to feet)
  // Height: 1.5 to 3.5 feet (typical strike zone)
  const strikeZoneLeft = -0.708;
  const strikeZoneRight = 0.708;
  const strikeZoneBottom = 1.5;
  const strikeZoneTop = 3.5;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>{data.name}</p>
          <p style={{ margin: "4px 0 0 0" }}>Side: {data.x.toFixed(2)} ft</p>
          <p style={{ margin: "4px 0 0 0" }}>Height: {data.y.toFixed(2)} ft</p>
          <p style={{ margin: "4px 0 0 0" }}>Usage: {data.usage.toFixed(1)}%</p>
          <p style={{ margin: "4px 0 0 0" }}>Speed: {data.speed.toFixed(1)} mph</p>
        </div>
      );
    }
    return null;
  };

  // Strike zone reference lines
  const StrikeZoneLines = () => (
    <>
      {/* Top and bottom lines */}
      <ReferenceLine y={strikeZoneTop} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
      <ReferenceLine y={strikeZoneBottom} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
      {/* Left and right lines */}
      <ReferenceLine x={strikeZoneLeft} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
      <ReferenceLine x={strikeZoneRight} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
    </>
  );

  return (
    <div style={{ marginTop: "2rem", marginBottom: "2rem", textAlign: "center" }}>
      <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600", textAlign: "center" }}>
        Strike Zone Plot
      </h3>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem", textAlign: "center" }}>
        Average pitch location at plate (dashed box = strike zone, negative side = left, positive = right)
      </p>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height={500}>
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
            <StrikeZoneLines />
            <Scatter 
              name="Pitch Types" 
              data={plotData} 
              fill="#8884d8"
            >
              {plotData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={pitchColors[entry.name] || "#95a5a6"} 
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem", textAlign: "center" }}>
          Pitch Type Legend:
        </div>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "1rem",
          fontSize: "0.85rem",
          justifyContent: "center"
        }}>
          {uniquePitches.map((pitch, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "16px",
                height: "16px",
                backgroundColor: pitch.color,
                borderRadius: "50%",
                border: "1px solid #ccc"
              }}></div>
              <span>{pitch.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

