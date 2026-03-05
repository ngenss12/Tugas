import { motion } from "framer-motion";
import { Brain, AlertTriangle, Shield, TrendingUp } from "lucide-react";

interface Insight {
  type: "critical" | "warning" | "info";
  category: string;
  title: string;
  summary: string;
  time: string;
}

const insights: Insight[] = [
  {
    type: "critical",
    category: "WORLD BRIEF",
    title: "Escalation in Middle East Theater",
    summary: "Military operations intensifying across multiple fronts. Air defense systems activated in multiple nations. NATO monitoring situation closely.",
    time: "2m ago",
  },
  {
    type: "warning",
    category: "GEOPOLITICAL",
    title: "South China Sea Tensions Rising",
    summary: "Naval exercises detected near contested waters. Satellite imagery shows increased military vessel activity in the region.",
    time: "15m ago",
  },
  {
    type: "info",
    category: "ECONOMIC",
    title: "European Markets Rally",
    summary: "Major European indices showing strong gains amid diplomatic progress. DAX leading with 1.74% gain on defense sector strength.",
    time: "32m ago",
  },
  {
    type: "warning",
    category: "CYBER",
    title: "Infrastructure Attack Detected",
    summary: "State-sponsored threat actors targeting critical infrastructure in Eastern Europe. CERT teams responding to multiple incidents.",
    time: "1h ago",
  },
];

const typeStyles: Record<string, { border: string; icon: typeof AlertTriangle; color: string }> = {
  critical: { border: "border-l-tactical-red", icon: AlertTriangle, color: "text-tactical-red" },
  warning: { border: "border-l-tactical-amber", icon: Shield, color: "text-tactical-amber" },
  info: { border: "border-l-tactical-blue", icon: TrendingUp, color: "text-tactical-blue" },
};

const AIInsightsPanel = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-panel-header border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-tactical-cyan" />
          <h3 className="text-[10px] font-display tracking-widest text-foreground">AI INSIGHTS</h3>
          <span className="flex items-center gap-1 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-tactical-green dot-pulse" />
            <span className="text-tactical-green">LIVE</span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {insights.map((insight, i) => {
          const style = typeStyles[insight.type];
          const Icon = style.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-card border border-panel-border border-l-2 ${style.border} rounded p-2.5`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3 h-3 ${style.color}`} />
                  <span className={`text-[8px] font-display tracking-widest ${style.color}`}>
                    {insight.category}
                  </span>
                </div>
                <span className="text-[8px] text-muted-foreground">{insight.time}</span>
              </div>
              <h4 className="text-[10px] font-bold text-foreground mb-1">{insight.title}</h4>
              <p className="text-[9px] text-muted-foreground leading-relaxed">{insight.summary}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
