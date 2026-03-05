import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface MapPoint {
  x: number;
  y: number;
  type: "conflict" | "alert" | "monitoring" | "nuclear" | "base";
  label: string;
  intensity: number;
}

const mockPoints: MapPoint[] = [
  { x: 55, y: 28, type: "conflict", label: "Middle East Theater", intensity: 0.9 },
  { x: 60, y: 32, type: "alert", label: "Iran", intensity: 1.0 },
  { x: 52, y: 26, type: "conflict", label: "Eastern Mediterranean", intensity: 0.7 },
  { x: 75, y: 35, type: "monitoring", label: "South China Sea", intensity: 0.5 },
  { x: 80, y: 30, type: "base", label: "Taiwan Strait", intensity: 0.6 },
  { x: 30, y: 22, type: "monitoring", label: "North Atlantic", intensity: 0.3 },
  { x: 47, y: 20, type: "base", label: "NATO HQ", intensity: 0.4 },
  { x: 55, y: 18, type: "nuclear", label: "Russia", intensity: 0.5 },
  { x: 68, y: 25, type: "nuclear", label: "Pakistan", intensity: 0.4 },
  { x: 70, y: 23, type: "nuclear", label: "India", intensity: 0.3 },
  { x: 82, y: 28, type: "nuclear", label: "North Korea", intensity: 0.6 },
  { x: 42, y: 45, type: "monitoring", label: "West Africa", intensity: 0.4 },
  { x: 50, y: 42, type: "conflict", label: "Sudan", intensity: 0.7 },
  { x: 22, y: 30, type: "monitoring", label: "Caribbean", intensity: 0.2 },
  { x: 58, y: 22, type: "base", label: "Black Sea", intensity: 0.6 },
  { x: 48, y: 16, type: "conflict", label: "Ukraine", intensity: 0.85 },
];

const typeColors: Record<string, string> = {
  conflict: "hsl(0, 75%, 55%)",
  alert: "hsl(0, 90%, 50%)",
  monitoring: "hsl(45, 90%, 55%)",
  nuclear: "hsl(270, 60%, 55%)",
  base: "hsl(142, 60%, 45%)",
};

const WorldMap = () => {
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* Grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Simplified world map outline using SVG */}
      <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Continents - simplified outlines */}
        {/* North America */}
        <path d="M12,12 L18,8 L25,9 L28,12 L30,16 L28,22 L24,24 L20,26 L18,30 L16,28 L14,22 L12,18 Z"
          fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth="0.15" opacity="0.5" />
        {/* South America */}
        <path d="M24,32 L28,30 L30,34 L32,38 L30,44 L28,48 L24,52 L22,48 L20,42 L22,36 Z"
          fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth="0.15" opacity="0.5" />
        {/* Europe */}
        <path d="M44,10 L48,8 L52,10 L50,14 L48,16 L44,16 L42,14 Z"
          fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth="0.15" opacity="0.5" />
        {/* Africa */}
        <path d="M44,22 L50,20 L54,24 L56,30 L54,38 L50,44 L46,42 L42,36 L40,28 Z"
          fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth="0.15" opacity="0.5" />
        {/* Asia */}
        <path d="M54,8 L62,6 L70,8 L80,10 L84,14 L82,20 L78,24 L72,26 L66,24 L60,20 L56,16 L54,12 Z"
          fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth="0.15" opacity="0.5" />
        {/* Australia */}
        <path d="M78,38 L84,36 L88,38 L88,42 L84,44 L80,42 Z"
          fill="none" stroke="hsl(142, 60%, 45%)" strokeWidth="0.15" opacity="0.5" />

        {/* Latitude lines */}
        {[10, 20, 30, 40, 50].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y}
            stroke="hsl(142, 60%, 45%)" strokeWidth="0.05" opacity="0.2" strokeDasharray="1,1" />
        ))}
        {/* Longitude lines */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="60"
            stroke="hsl(142, 60%, 45%)" strokeWidth="0.05" opacity="0.2" strokeDasharray="1,1" />
        ))}

        {/* Data points */}
        {mockPoints.map((point, i) => (
          <g key={i}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Pulse ring */}
            <circle
              cx={point.x} cy={point.y}
              r={1 + Math.sin(time * 0.05 + i) * 0.5}
              fill="none"
              stroke={typeColors[point.type]}
              strokeWidth="0.1"
              opacity={0.3 + Math.sin(time * 0.05 + i) * 0.2}
            />
            {/* Core dot */}
            <circle
              cx={point.x} cy={point.y}
              r={point.type === "nuclear" ? 0.6 : 0.4}
              fill={typeColors[point.type]}
              opacity={0.8}
            />
            {point.intensity > 0.7 && (
              <circle
                cx={point.x} cy={point.y}
                r={2 + Math.sin(time * 0.08 + i) * 0.8}
                fill="none"
                stroke={typeColors[point.type]}
                strokeWidth="0.08"
                opacity={0.15}
              />
            )}
          </g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hoveredPoint && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 bg-card border border-panel-border rounded px-3 py-2 text-xs pointer-events-none"
          style={{
            left: `${hoveredPoint.x}%`,
            top: `${hoveredPoint.y - 5}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-display text-foreground">{hoveredPoint.label}</div>
          <div className="text-muted-foreground capitalize">{hoveredPoint.type} • Intensity: {(hoveredPoint.intensity * 100).toFixed(0)}%</div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-panel-border rounded px-3 py-2">
        <span className="text-[9px] text-muted-foreground font-display tracking-widest">LEGEND</span>
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-3 right-3 text-[8px] text-muted-foreground/50">
        WEBGL • © OpenStreetMap
      </div>
    </div>
  );
};

export default WorldMap;
