import { useState } from "react";
import { motion } from "framer-motion";

interface Layer {
  id: string;
  icon: string;
  label: string;
  active: boolean;
  category: "military" | "infrastructure" | "events" | "environment" | "intelligence";
}

const initialLayers: Layer[] = [
  { id: "intel-hotspots", icon: "🎯", label: "Intel Hotspots", active: true, category: "intelligence" },
  { id: "conflict-zones", icon: "⚔", label: "Conflict Zones", active: true, category: "military" },
  { id: "military-bases", icon: "🏛", label: "Military Bases", active: false, category: "military" },
  { id: "nuclear-sites", icon: "☢", label: "Nuclear Sites", active: false, category: "infrastructure" },
  { id: "spaceports", icon: "🚀", label: "Spaceports", active: false, category: "infrastructure" },
  { id: "undersea-cables", icon: "🔌", label: "Undersea Cables", active: false, category: "infrastructure" },
  { id: "pipelines", icon: "🛢", label: "Pipelines", active: false, category: "infrastructure" },
  { id: "ai-datacenters", icon: "🖥", label: "AI Data Centers", active: false, category: "infrastructure" },
  { id: "military-activity", icon: "✈", label: "Military Activity", active: true, category: "military" },
  { id: "ship-traffic", icon: "🚢", label: "Ship Traffic", active: false, category: "events" },
  { id: "trade-routes", icon: "⚓", label: "Trade Routes", active: false, category: "events" },
  { id: "aviation", icon: "✈", label: "Aviation", active: false, category: "events" },
  { id: "protests", icon: "📢", label: "Protests", active: false, category: "events" },
  { id: "armed-conflict", icon: "⚔", label: "Armed Conflict Events", active: false, category: "events" },
  { id: "displacement", icon: "👥", label: "Displacement Flows", active: false, category: "events" },
  { id: "climate-anomalies", icon: "🌫", label: "Climate Anomalies", active: false, category: "environment" },
  { id: "weather-alerts", icon: "⛈", label: "Weather Alerts", active: true, category: "environment" },
  { id: "internet-outages", icon: "📡", label: "Internet Outages", active: true, category: "intelligence" },
  { id: "cyber-threats", icon: "🛡", label: "Cyber Threats", active: true, category: "intelligence" },
  { id: "natural-events", icon: "🌋", label: "Natural Events", active: true, category: "environment" },
  { id: "fires", icon: "🔥", label: "Fires", active: true, category: "environment" },
  { id: "strategic-waterways", icon: "⚓", label: "Strategic Waterways", active: true, category: "military" },
  { id: "economic-centers", icon: "💰", label: "Economic Centers", active: true, category: "intelligence" },
  { id: "critical-minerals", icon: "💎", label: "Critical Minerals", active: false, category: "intelligence" },
  { id: "gps-jamming", icon: "📡", label: "GPS Jamming", active: false, category: "intelligence" },
  { id: "day-night", icon: "🌓", label: "Day/Night", active: false, category: "environment" },
];

const LayerSidebar = () => {
  const [layers, setLayers] = useState(initialLayers);

  const toggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l))
    );
  };

  return (
    <aside className="w-48 bg-panel border-r border-panel-border overflow-y-auto flex-shrink-0">
      <div className="p-2">
        <h3 className="text-[10px] text-muted-foreground font-display tracking-widest mb-2 px-1">
          LAYERS
        </h3>
        <div className="space-y-0.5">
          {layers.map((layer) => (
            <motion.button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                layer.active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] ${
                  layer.active
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {layer.active && "✓"}
              </div>
              <span className="text-[10px]">{layer.icon}</span>
              <span className="text-[10px] uppercase tracking-wide truncate font-display">
                {layer.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default LayerSidebar;
