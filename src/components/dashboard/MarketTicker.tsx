import { motion } from "framer-motion";

interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
  up: boolean;
}

const indices: MarketIndex[] = [
  { name: "S&P 500", value: "5,842.31", change: "+42.18", changePercent: "0.73%", up: true },
  { name: "NASDAQ", value: "18,291.65", change: "-128.34", changePercent: "0.70%", up: false },
  { name: "DOW", value: "43,127.89", change: "+215.67", changePercent: "0.50%", up: true },
  { name: "FTSE 100", value: "10,567.65", change: "+83.52", changePercent: "0.80%", up: true },
  { name: "CAC 40", value: "8,167.73", change: "+63.89", changePercent: "0.79%", up: true },
  { name: "DAX", value: "24,205.36", change: "+414.71", changePercent: "1.74%", up: true },
  { name: "NIKKEI", value: "38,451.22", change: "-312.45", changePercent: "0.81%", up: false },
  { name: "HANG SENG", value: "22,156.78", change: "+189.34", changePercent: "0.86%", up: true },
  { name: "BTC/USD", value: "97,234.50", change: "+1,245.30", changePercent: "1.30%", up: true },
  { name: "GOLD", value: "2,934.20", change: "+18.40", changePercent: "0.63%", up: true },
  { name: "OIL/WTI", value: "78.45", change: "-0.82", changePercent: "1.03%", up: false },
];

const MarketTicker = () => {
  const duplicated = [...indices, ...indices];

  return (
    <div className="overflow-hidden bg-panel border-b border-panel-border py-1">
      <motion.div className="flex whitespace-nowrap animate-ticker">
        {duplicated.map((idx, i) => (
          <div key={i} className="flex items-center gap-2 px-4 border-r border-panel-border last:border-r-0">
            <span className="text-[9px] font-display text-muted-foreground">{idx.name}</span>
            <span className="text-[10px] font-bold text-foreground">{idx.value}</span>
            <span className={`text-[9px] font-bold ${idx.up ? "text-tactical-green" : "text-tactical-red"}`}>
              {idx.up ? "▲" : "▼"} {idx.change}
            </span>
            <span className={`text-[9px] ${idx.up ? "text-tactical-green" : "text-tactical-red"}`}>
              {idx.changePercent}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default MarketTicker;
