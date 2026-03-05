import { motion } from "framer-motion";
import { Globe, Github, Radio } from "lucide-react";

const DEFCON_COLORS: Record<number, string> = {
  1: "bg-tactical-red",
  2: "bg-destructive",
  3: "bg-tactical-amber",
  4: "bg-tactical-green",
  5: "bg-tactical-blue",
};

interface StatusBarProps {
  defconLevel: number;
  region: string;
  onRegionChange: (region: string) => void;
}

const regions = ["Global", "Americas", "MENA", "Europe", "Asia", "Africa", "Oceania"];

const StatusBar = ({ defconLevel, region, onRegionChange }: StatusBarProps) => {
  const now = new Date();
  const utcString = now.toUTCString();

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-panel border-b border-panel-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-tactical-green" />
          <span className="font-display text-sm font-bold tracking-wider text-foreground">
            WORLD MONITOR
          </span>
          <span className="text-xs text-muted-foreground">v1.0.0</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Radio className="w-3 h-3 text-tactical-green dot-pulse" />
          <span className="text-tactical-green">LIVE</span>
        </div>

        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          className="bg-secondary text-foreground text-xs px-2 py-1 rounded border border-panel-border outline-none focus:border-primary"
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <motion.div
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold ${DEFCON_COLORS[defconLevel]} text-primary-foreground`}
          animate={{ opacity: defconLevel <= 2 ? [1, 0.6, 1] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          DEFCON {defconLevel}
          <span className="text-[10px] opacity-80">
            {defconLevel <= 2 ? "100%" : `${100 - defconLevel * 15}%`}
          </span>
        </motion.div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground font-mono">{utcString}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-tactical-green/10 text-tactical-green rounded border border-tactical-green/20">
            ● Online
          </span>
        </div>
      </div>
    </header>
  );
};

export default StatusBar;
