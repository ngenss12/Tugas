import { useMemo, useState } from "react";
import StatusBar from "@/components/dashboard/StatusBar";
import LayerSidebar, { initialLayers } from "@/components/dashboard/LayerSidebar";
import WorldMap from "@/components/dashboard/WorldMap";
import LiveNewsPanel from "@/components/dashboard/LiveNewsPanel";
import MarketTicker from "@/components/dashboard/MarketTicker";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import StrategicPosture from "@/components/dashboard/StrategicPosture";

const Index = () => {
  const [defconLevel, setDefconLevel] = useState(3);
  const [region, setRegion] = useState("Global");
  const [layers, setLayers] = useState(initialLayers);

  const toggleLayer = (id: string) => {
    setLayers((previous) =>
      previous.map((layer) => (layer.id === id ? { ...layer, active: !layer.active } : layer)),
    );
  };

  const activeLayerIds = useMemo(
    () => layers.filter((layer) => layer.active).map((layer) => layer.id),
    [layers],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <StatusBar defconLevel={defconLevel} region={region} onRegionChange={setRegion} />
      <MarketTicker />

      <div className="flex flex-1 overflow-hidden">
        {/* Layer Sidebar */}
        <LayerSidebar layers={layers} onToggleLayer={toggleLayer} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Main Map Area */}
            <div className="flex-1 relative">
              <WorldMap activeLayerIds={activeLayerIds} />
              {/* Region label */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm border border-panel-border rounded px-4 py-1.5">
                <h2 className="text-xs font-display tracking-widest text-foreground">{region} Situation</h2>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-[420px] max-xl:w-[380px] flex border-l border-panel-border flex-shrink-0 overflow-hidden">
              <div className="flex-1 border-r border-panel-border overflow-hidden">
                <AIInsightsPanel />
              </div>
              <div className="flex-1 overflow-hidden">
                <StrategicPosture />
              </div>
            </div>
          </div>

          {/* Live News moved below */}
          <div className="h-[360px] max-lg:h-[420px] border-t border-panel-border">
            <LiveNewsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
