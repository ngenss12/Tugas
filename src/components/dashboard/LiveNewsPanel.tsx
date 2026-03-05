import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Maximize2 } from "lucide-react";

const channels = [
  { id: "bloomberg", label: "Bloomberg", color: "bg-tactical-amber" },
  { id: "skynews", label: "SkyNews", color: "bg-secondary" },
  { id: "euronews", label: "Euronews", color: "bg-secondary" },
  { id: "dw", label: "DW", color: "bg-secondary" },
  { id: "cnbc", label: "CNBC", color: "bg-secondary" },
  { id: "cnn", label: "CNN", color: "bg-secondary" },
  { id: "aljazeera", label: "AlJazeera", color: "bg-secondary" },
];

const LiveNewsPanel = () => {
  const [activeChannel, setActiveChannel] = useState("bloomberg");
  const [muted, setMuted] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-panel-header border-b border-panel-border">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-display tracking-widest text-foreground">LIVE NEWS</h3>
          <span className="flex items-center gap-1 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-tactical-red dot-pulse" />
            <span className="text-tactical-red">LIVE</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMuted(!muted)} className="p-1 hover:bg-secondary rounded">
            {muted ? <VolumeX className="w-3 h-3 text-muted-foreground" /> : <Volume2 className="w-3 h-3 text-foreground" />}
          </button>
          <button className="p-1 hover:bg-secondary rounded">
            <Maximize2 className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-2 py-1.5 bg-panel overflow-x-auto">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id)}
            className={`px-2 py-0.5 rounded text-[9px] font-display tracking-wider whitespace-nowrap transition-colors ${
              activeChannel === ch.id
                ? "bg-tactical-red text-destructive-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {ch.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Mock video area */}
      <div className="flex-1 bg-background relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
              <div className="w-0 h-0 border-l-[12px] border-l-foreground border-y-[8px] border-y-transparent ml-1" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-display text-foreground">
                {channels.find(c => c.id === activeChannel)?.label} Live Stream
              </p>
              <p className="text-[10px] text-muted-foreground">Tap to play</p>
            </div>
          </div>
        </div>

        {/* Scanline effect */}
        <div className="absolute inset-0 scanline pointer-events-none opacity-30" />
      </div>
    </div>
  );
};

export default LiveNewsPanel;
