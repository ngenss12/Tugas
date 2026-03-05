import { motion } from "framer-motion";

export interface Layer {
  id: string;
  icon: string;
  label: string;
  active: boolean;
  category: "military" | "infrastructure" | "events" | "environment" | "intelligence";
}

export const initialLayers: Layer[] = [
  { id: "intel-hotspots", icon: "INT", label: "Intel Hotspots", active: true, category: "intelligence" },
  { id: "conflict-zones", icon: "WAR", label: "Conflict Zones", active: true, category: "military" },
  { id: "military-bases", icon: "BAS", label: "Military Bases", active: false, category: "military" },
  { id: "nuclear-sites", icon: "NUC", label: "Nuclear Sites", active: true, category: "infrastructure" },
  { id: "spaceports", icon: "SPC", label: "Spaceports", active: false, category: "infrastructure" },
  { id: "undersea-cables", icon: "CAB", label: "Undersea Cables", active: false, category: "infrastructure" },
  { id: "pipelines", icon: "PIP", label: "Pipelines", active: false, category: "infrastructure" },
  { id: "ai-datacenters", icon: "DC", label: "AI Data Centers", active: false, category: "infrastructure" },
  { id: "military-activity", icon: "AIR", label: "Military Activity", active: true, category: "military" },
  { id: "ship-traffic", icon: "SEA", label: "Ship Traffic", active: false, category: "events" },
  { id: "trade-routes", icon: "TRD", label: "Trade Routes", active: false, category: "events" },
  { id: "aviation", icon: "FLY", label: "Aviation", active: false, category: "events" },
  { id: "protests", icon: "PRT", label: "Protests", active: false, category: "events" },
  { id: "armed-conflict", icon: "ACF", label: "Armed Conflict Events", active: false, category: "events" },
  { id: "displacement", icon: "DSP", label: "Displacement Flows", active: false, category: "events" },
  { id: "climate-anomalies", icon: "CLM", label: "Climate Anomalies", active: false, category: "environment" },
  { id: "weather-alerts", icon: "WTH", label: "Weather Alerts", active: true, category: "environment" },
  { id: "internet-outages", icon: "NET", label: "Internet Outages", active: true, category: "intelligence" },
  { id: "cyber-threats", icon: "CYB", label: "Cyber Threats", active: true, category: "intelligence" },
  { id: "natural-events", icon: "NAT", label: "Natural Events", active: true, category: "environment" },
  { id: "fires", icon: "FIR", label: "Fires", active: true, category: "environment" },
  { id: "strategic-waterways", icon: "WAT", label: "Strategic Waterways", active: true, category: "military" },
  { id: "economic-centers", icon: "ECO", label: "Economic Centers", active: true, category: "intelligence" },
  { id: "critical-minerals", icon: "MIN", label: "Critical Minerals", active: false, category: "intelligence" },
  { id: "gps-jamming", icon: "GPS", label: "GPS Jamming", active: false, category: "intelligence" },
  { id: "day-night", icon: "D/N", label: "Day/Night", active: false, category: "environment" },
];

interface LayerSidebarProps {
  layers: Layer[];
  onToggleLayer: (id: string) => void;
}

const LayerSidebar = ({ layers, onToggleLayer }: LayerSidebarProps) => {
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
              onClick={() => onToggleLayer(layer.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                layer.active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] ${
                  layer.active ? "bg-primary border-primary" : "border-muted-foreground/40"
                }`}
              >
                {layer.active && "*"}
              </div>
              <span className="text-[10px] tabular-nums">{layer.icon}</span>
              <span className="text-[10px] uppercase tracking-wide truncate font-display">{layer.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default LayerSidebar;
