import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, RefreshCw, Volume2, VolumeX } from "lucide-react";

type NewsSeverity = "critical" | "high" | "medium" | "low";
type TimeRange = "6h" | "24h" | "7d";

interface NewsItem {
  source: string;
  title: string;
  severity: NewsSeverity;
  ageHours: number;
  category: string;
  link: string;
  publishedAt: number;
}

interface LiveChannel {
  id: string;
  label: string;
  handle: string;
  fallbackVideoId: string;
}

interface LiveVideoResult {
  videoId: string | null;
  isLive: boolean;
  source: "proxy" | "worldmonitor" | "fallback";
}

const LIVE_CHANNELS: LiveChannel[] = [
  { id: "bloomberg", label: "Bloomberg", handle: "@markets", fallbackVideoId: "iEpJwprxDdk" },
  { id: "skynews", label: "SkyNews", handle: "@SkyNews", fallbackVideoId: "uvviIF4725I" },
  { id: "euronews", label: "Euronews", handle: "@euronews", fallbackVideoId: "pykpO5kQJ98" },
  { id: "dw", label: "DW", handle: "@DWNews", fallbackVideoId: "LuKwFajn37U" },
  { id: "cnbc", label: "CNBC", handle: "@CNBC", fallbackVideoId: "9NyxcX3rhQs" },
  { id: "cnn", label: "CNN", handle: "@CNN", fallbackVideoId: "w_Ma8oQLmSM" },
  { id: "aljazeera", label: "AlJazeera", handle: "@AlJazeeraEnglish", fallbackVideoId: "gCNeDWCI0vo" },
];

const FALLBACK_NEWS: NewsItem[] = [
  {
    source: "Reuters World",
    title: "Ship traffic anomaly rises near Bab-el-Mandeb corridor",
    severity: "high",
    ageHours: 2,
    category: "conflict",
    link: "#",
    publishedAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    source: "AP News",
    title: "Regional leaders call emergency talks after cross-border incident",
    severity: "critical",
    ageHours: 4,
    category: "conflict",
    link: "#",
    publishedAt: Date.now() - 4 * 60 * 60 * 1000,
  },
  {
    source: "Bloomberg",
    title: "Oil futures widen as shipping premiums jump in key lanes",
    severity: "medium",
    ageHours: 7,
    category: "market",
    link: "#",
    publishedAt: Date.now() - 7 * 60 * 60 * 1000,
  },
  {
    source: "Al Jazeera",
    title: "Ceasefire talks resume amid overnight strike reports",
    severity: "high",
    ageHours: 11,
    category: "conflict",
    link: "#",
    publishedAt: Date.now() - 11 * 60 * 60 * 1000,
  },
  {
    source: "Financial Times",
    title: "Central bank watch: risk appetite softens in Asia session",
    severity: "medium",
    ageHours: 16,
    category: "market",
    link: "#",
    publishedAt: Date.now() - 16 * 60 * 60 * 1000,
  },
  {
    source: "BBC World",
    title: "Aid corridors reopen in selected border zones",
    severity: "medium",
    ageHours: 22,
    category: "humanitarian",
    link: "#",
    publishedAt: Date.now() - 22 * 60 * 60 * 1000,
  },
  {
    source: "CNBC",
    title: "Defense and energy names outperform as volatility climbs",
    severity: "low",
    ageHours: 26,
    category: "market",
    link: "#",
    publishedAt: Date.now() - 26 * 60 * 60 * 1000,
  },
];

const RANGE_TO_HOURS: Record<TimeRange, number> = {
  "6h": 6,
  "24h": 24,
  "7d": 168,
};

const SEVERITY_STYLES: Record<NewsSeverity, string> = {
  critical: "bg-red-500/20 border-red-500/40 text-red-300",
  high: "bg-orange-500/20 border-orange-500/40 text-orange-300",
  medium: "bg-amber-500/20 border-amber-500/40 text-amber-300",
  low: "bg-sky-500/20 border-sky-500/40 text-sky-300",
};

const NEWS_REFRESH_MS = 5 * 60 * 1000;
const LIVE_VIDEO_REFRESH_MS = 2 * 60 * 1000;
const LIVE_VIDEO_CACHE_TTL_MS = 5 * 60 * 1000;
const YOUTUBE_VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

const liveVideoCache = new Map<string, { videoId: string | null; isLive: boolean; timestamp: number }>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeSeverity = (raw: unknown, threatLevel?: unknown): NewsSeverity => {
  const severity = String(raw ?? "").toLowerCase();
  if (severity === "critical" || severity === "high" || severity === "medium" || severity === "low") {
    return severity;
  }

  const threat = String(threatLevel ?? "").toUpperCase();
  if (threat === "THREAT_LEVEL_CRITICAL") return "critical";
  if (threat === "THREAT_LEVEL_HIGH") return "high";
  if (threat === "THREAT_LEVEL_MEDIUM") return "medium";
  return "low";
};

const toEpochMillis = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return parsed < 1_000_000_000_000 ? parsed * 1000 : parsed;
};

const ageHoursFromTimestamp = (value: unknown): number => {
  const publishedAt = toEpochMillis(value);
  if (!publishedAt) {
    return 999;
  }
  return Math.max(0, Math.round((Date.now() - publishedAt) / (1000 * 60 * 60)));
};

const buildEmbedUrl = (videoId: string, muted: boolean): string =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=${
    muted ? 1 : 0
  }&controls=1&modestbranding=1&playsinline=1&rel=0&vq=hd1080`;

const formatAge = (ageHours: number): string => (ageHours <= 0 ? "<1h ago" : `${ageHours}h ago`);

const normalizeNewsItem = (raw: Record<string, unknown>, fallbackCategory: string): NewsItem | null => {
  const title = String(raw.title ?? "").trim();
  if (!title) {
    return null;
  }

  const source = String(raw.source ?? "Unknown").trim() || "Unknown";
  const link = String(raw.link ?? "#").trim() || "#";
  const category = String(raw.category ?? fallbackCategory ?? "global").toLowerCase();
  const threatLevel = isRecord(raw.threat) ? raw.threat.level : undefined;
  const severity = normalizeSeverity(raw.severity, threatLevel);
  const publishedAt = toEpochMillis(raw.publishedAt);

  return {
    source,
    title,
    severity,
    category,
    link,
    publishedAt,
    ageHours: ageHoursFromTimestamp(publishedAt),
  };
};

const normalizeNewsPayload = (payload: unknown): NewsItem[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const items: NewsItem[] = [];

  if (Array.isArray(payload.items)) {
    for (const entry of payload.items) {
      if (!isRecord(entry)) {
        continue;
      }
      const normalized = normalizeNewsItem(entry, "global");
      if (normalized) {
        items.push(normalized);
      }
    }
  }

  if (isRecord(payload.categories)) {
    for (const [category, bucketValue] of Object.entries(payload.categories)) {
      if (!isRecord(bucketValue) || !Array.isArray(bucketValue.items)) {
        continue;
      }

      for (const entry of bucketValue.items) {
        if (!isRecord(entry)) {
          continue;
        }
        const normalized = normalizeNewsItem(entry, category);
        if (normalized) {
          items.push(normalized);
        }
      }
    }
  }

  const deduped = new Map<string, NewsItem>();
  for (const item of items) {
    const key = `${item.source}-${item.title}-${item.publishedAt}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 120);
};

const fetchJsonWithTimeout = async (url: string, timeoutMs: number): Promise<unknown> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
};

const loadNewsFeed = async (): Promise<{ items: NewsItem[]; source: string; error: string | null }> => {
  const endpoints = [
    { url: "/api/worldmonitor/news?variant=full&lang=en", source: "proxy" },
    { url: "https://worldmonitor.app/api/news/v1/list-feed-digest?variant=full&lang=en", source: "worldmonitor" },
  ] as const;

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJsonWithTimeout(endpoint.url, 15000);
      const items = normalizeNewsPayload(payload);
      if (items.length > 0) {
        return { items, source: endpoint.source, error: null };
      }
    } catch {
      continue;
    }
  }

  return {
    items: FALLBACK_NEWS,
    source: "fallback",
    error: "Live feed unavailable. Showing fallback headlines.",
  };
};

const resolveLiveVideo = async (channel: LiveChannel): Promise<LiveVideoResult> => {
  const cached = liveVideoCache.get(channel.handle);
  if (cached && Date.now() - cached.timestamp < LIVE_VIDEO_CACHE_TTL_MS) {
    if (cached.videoId) {
      return {
        videoId: cached.videoId,
        isLive: cached.isLive,
        source: cached.isLive ? "worldmonitor" : "fallback",
      };
    }
  }

  const encodedHandle = encodeURIComponent(channel.handle);
  const endpoints = [
    { url: `/api/worldmonitor/youtube/live?channel=${encodedHandle}`, source: "proxy" as const },
    { url: `https://worldmonitor.app/api/youtube/live?channel=${encodedHandle}`, source: "worldmonitor" as const },
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJsonWithTimeout(endpoint.url, 12000);
      if (!isRecord(payload)) {
        continue;
      }

      const videoId = typeof payload.videoId === "string" ? payload.videoId : null;
      const isLive = Boolean(payload.isLive);

      if (videoId && YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
        liveVideoCache.set(channel.handle, {
          videoId,
          isLive,
          timestamp: Date.now(),
        });

        return {
          videoId,
          isLive,
          source: endpoint.source,
        };
      }
    } catch {
      continue;
    }
  }

  liveVideoCache.set(channel.handle, {
    videoId: channel.fallbackVideoId,
    isLive: false,
    timestamp: Date.now(),
  });

  return {
    videoId: channel.fallbackVideoId,
    isLive: false,
    source: "fallback",
  };
};

const LiveNewsPanel = () => {
  const [activeChannelId, setActiveChannelId] = useState(LIVE_CHANNELS[0].id);
  const [muted, setMuted] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24h");

  const [newsFeed, setNewsFeed] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [newsSource, setNewsSource] = useState("fallback");
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastNewsUpdate, setLastNewsUpdate] = useState<string>("--:--:--");

  const [activeVideoId, setActiveVideoId] = useState<string | null>(LIVE_CHANNELS[0].fallbackVideoId);
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  const activeChannel = useMemo(
    () => LIVE_CHANNELS.find((channel) => channel.id === activeChannelId) ?? LIVE_CHANNELS[0],
    [activeChannelId],
  );

  const visibleNews = useMemo(() => {
    const maxAgeHours = RANGE_TO_HOURS[selectedRange];
    return newsFeed.filter((item) => item.ageHours <= maxAgeHours).slice(0, 60);
  }, [newsFeed, selectedRange]);

  const activeWatchUrl = activeVideoId
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(activeVideoId)}`
    : `https://www.youtube.com/${activeChannel.handle}`;

  const refreshNews = async () => {
    setNewsLoading(true);
    const result = await loadNewsFeed();
    setNewsFeed(result.items);
    setNewsSource(result.source);
    setNewsError(result.error);
    setNewsLoading(false);
    setLastNewsUpdate(
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
      }),
    );
  };

  useEffect(() => {
    let cancelled = false;

    const syncNews = async () => {
      if (cancelled) return;
      setNewsLoading(true);
      const result = await loadNewsFeed();
      if (cancelled) return;

      setNewsFeed(result.items);
      setNewsSource(result.source);
      setNewsError(result.error);
      setNewsLoading(false);
      setLastNewsUpdate(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
        }),
      );
    };

    void syncNews();
    const timer = window.setInterval(() => {
      void syncNews();
    }, NEWS_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncVideo = async () => {
      if (cancelled) return;
      setVideoLoading(true);
      const result = await resolveLiveVideo(activeChannel);
      if (cancelled) return;

      setActiveVideoId(result.videoId);
      setIsLiveNow(result.isLive);
      setVideoLoading(false);
    };

    void syncVideo();
    const timer = window.setInterval(() => {
      void syncVideo();
    }, LIVE_VIDEO_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeChannel]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-3 py-2 bg-panel-header border-b border-panel-border">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-display tracking-widest text-foreground">LIVE NEWS</h3>
          <span className="flex items-center gap-1 text-[9px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveNow ? "bg-tactical-red dot-pulse" : "bg-tactical-amber"
              }`}
            />
            <span className={isLiveNow ? "text-tactical-red" : "text-tactical-amber"}>
              {isLiveNow ? "LIVE NOW" : "STREAM"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => void refreshNews()}
            className="p-1 hover:bg-secondary rounded"
            title="Refresh headlines"
          >
            <RefreshCw
              className={`w-3 h-3 ${newsLoading ? "animate-spin text-foreground" : "text-muted-foreground"}`}
            />
          </button>
          <button onClick={() => setMuted((value) => !value)} className="p-1 hover:bg-secondary rounded">
            {muted ? (
              <VolumeX className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Volume2 className="w-3 h-3 text-foreground" />
            )}
          </button>
          <a
            href={activeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-secondary rounded"
            title="Open stream on YouTube"
          >
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      <div className="flex gap-1 px-2 py-1.5 bg-panel overflow-x-auto border-b border-panel-border">
        {LIVE_CHANNELS.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setActiveChannelId(channel.id)}
            className={`px-2 py-0.5 rounded text-[9px] font-display tracking-wider whitespace-nowrap transition-colors ${
              activeChannelId === channel.id
                ? "bg-tactical-red text-destructive-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {channel.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col min-h-0 bg-panel xl:border-r border-panel-border">
          <div className="p-2 pb-1">
            <div className="relative h-[220px] rounded border border-panel-border overflow-hidden bg-black">
              {activeVideoId ? (
                <iframe
                  key={`${activeChannel.id}-${activeVideoId}-${muted ? "muted" : "unmuted"}`}
                  src={buildEmbedUrl(activeVideoId, muted)}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={`${activeChannel.label} live`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                  Stream unavailable.
                </div>
              )}

              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 text-[8px] text-white/90 uppercase tracking-wider">
                {activeChannel.label}
              </div>

              {videoLoading && (
                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/65 text-[8px] text-white/90">
                  Checking live status...
                </div>
              )}
            </div>
          </div>

          <div className="px-2 pb-2 text-[8px] text-muted-foreground flex items-center justify-between gap-2">
            <span className="truncate">Channel: {activeChannel.handle}</span>
            <span className={isLiveNow ? "text-tactical-red" : "text-tactical-amber"}>
              {isLiveNow ? "LIVE FEED" : "FALLBACK VIDEO"}
            </span>
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="px-2 py-1 bg-panel-header border-y xl:border-y-0 xl:border-b border-panel-border flex items-center justify-between gap-2">
            <select
              value={selectedRange}
              onChange={(event) => setSelectedRange(event.target.value as TimeRange)}
              className="text-[9px] bg-secondary border border-panel-border rounded px-1.5 py-0.5 text-foreground"
            >
              <option value="6h">6h</option>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
            </select>

            <div className="text-[8px] text-muted-foreground text-right">
              <div>Source: {newsSource}</div>
              <div>Updated: {lastNewsUpdate}</div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 bg-background">
            {newsError && (
              <div className="text-[9px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">
                {newsError}
              </div>
            )}

            {visibleNews.map((item, index) => (
              <motion.article
                key={`${item.source}-${item.publishedAt}-${index}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-card border border-panel-border rounded px-2 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-foreground font-semibold truncate">{item.source}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[item.severity]}`}>
                    {item.severity.toUpperCase()}
                  </span>
                </div>

                <a
                  href={item.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-[10px] text-foreground/90 hover:text-foreground leading-tight"
                >
                  {item.title}
                </a>

                <div className="mt-1 flex items-center justify-between text-[8px] text-muted-foreground">
                  <span>{formatAge(item.ageHours)}</span>
                  <span className="uppercase tracking-wider">{item.category}</span>
                </div>
              </motion.article>
            ))}

            {visibleNews.length === 0 && (
              <div className="text-[10px] text-muted-foreground text-center py-3">
                No headlines in selected range.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveNewsPanel;
