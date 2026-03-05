import { motion } from "framer-motion";
import { Shield, Plane, Ship, Anchor } from "lucide-react";

interface Theater {
  name: string;
  status: "CRIT" | "HIGH" | "ELEVATED" | "MODERATE" | "LOW";
  air: number;
  sea: number;
  land: number;
}

const theaters: Theater[] = [
  { name: "Middle East Theater", status: "CRIT", air: 2, sea: 1, land: 10 },
  { name: "Indo-Pacific", status: "HIGH", air: 4, sea: 3, land: 5 },
  { name: "Eastern Europe", status: "ELEVATED", air: 3, sea: 2, land: 8 },
  { name: "North Africa", status: "MODERATE", air: 1, sea: 1, land: 3 },
  { name: "Arctic", status: "LOW", air: 1, sea: 2, land: 0 },
];

const statusColors: Record<string, string> = {
  CRIT: "text-tactical-red",
  HIGH: "text-tactical-red",
  ELEVATED: "text-tactical-amber",
  MODERATE: "text-tactical-amber",
  LOW: "text-tactical-green",
};

const StrategicPosture = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-panel-header border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-tactical-amber" />
          <h3 className="text-[10px] font-display tracking-widest text-foreground">AI STRATEGIC POSTURE</h3>
          <span className="px-1.5 py-0.5 bg-tactical-amber/20 text-tactical-amber text-[8px] rounded font-display">
            {theaters.filter(t => t.status === "CRIT" || t.status === "HIGH").length} NEW
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {theaters.map((theater, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-panel-border rounded p-2.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-display text-foreground">{theater.name}</span>
              <span className={`text-[9px] font-bold ${statusColors[theater.status]}`}>
                {theater.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Plane className="w-3 h-3" />
                <span>AIR</span>
                <span className="text-foreground font-bold">{theater.air}</span>
              </div>
              <div className="flex items-center gap-1">
                <Ship className="w-3 h-3" />
                <span>SEA</span>
                <span className="text-foreground font-bold">{theater.sea}</span>
              </div>
              <div className="flex items-center gap-1">
                <Anchor className="w-3 h-3" />
                <span>LAND</span>
                <span className="text-foreground font-bold">{theater.land}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StrategicPosture;
