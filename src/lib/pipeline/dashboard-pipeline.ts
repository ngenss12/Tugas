export type PipelineLayer = "ingestion" | "processing" | "presentation";

export interface PipelineStep {
  id: string;
  layer: PipelineLayer;
  input: string;
  output: string;
  owner: string;
  schedule: string;
}

export const DASHBOARD_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "proxy-news",
    layer: "ingestion",
    input: "GET /api/worldmonitor/news",
    output: "worldmonitor digest payload",
    owner: "vite.config.ts",
    schedule: "on demand + 5m refresh",
  },
  {
    id: "proxy-youtube-live",
    layer: "ingestion",
    input: "GET /api/worldmonitor/youtube/live",
    output: "live video status payload",
    owner: "vite.config.ts",
    schedule: "on channel change + 2m refresh",
  },
  {
    id: "normalize-news",
    layer: "processing",
    input: "raw payload (items + categories)",
    output: "deduped sorted NewsItem[]",
    owner: "LiveNewsPanel.tsx",
    schedule: "every fetch cycle",
  },
  {
    id: "resolve-live-video",
    layer: "processing",
    input: "channel handle",
    output: "videoId + isLive + fallback state",
    owner: "LiveNewsPanel.tsx",
    schedule: "every fetch cycle with cache",
  },
  {
    id: "map-news-match",
    layer: "processing",
    input: "clicked city/country",
    output: "best matching headline + source link",
    owner: "WorldMap.tsx",
    schedule: "on marker click",
  },
  {
    id: "render-dashboard",
    layer: "presentation",
    input: "view model states",
    output: "map + side panels + live strip",
    owner: "Index.tsx",
    schedule: "reactive render",
  },
];

export const PIPELINE_TIMERS = {
  newsRefreshMs: 5 * 60 * 1000,
  liveVideoRefreshMs: 2 * 60 * 1000,
  liveVideoCacheTtlMs: 5 * 60 * 1000,
} as const;
