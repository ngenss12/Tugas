import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Coordinate = [number, number];

interface PolygonGeometry {
  type: "Polygon";
  coordinates: Coordinate[][];
}

interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: Coordinate[][][];
}

type CountryGeometry = PolygonGeometry | MultiPolygonGeometry | null;

interface CountryFeature {
  type: "Feature";
  geometry: CountryGeometry;
  properties?: {
    name?: string;
  };
}

interface CountryGeoJson {
  type: "FeatureCollection";
  features: CountryFeature[];
}

interface IrradiatorFacility {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

interface IrradiatorDataset {
  source?: string;
  extracted?: string;
  totalFacilities?: number;
  facilities?: IrradiatorFacility[];
}

interface MapPoint extends IrradiatorFacility {
  x: number;
  y: number;
}

interface MapNewsItem {
  source: string;
  title: string;
  link: string;
  category: string;
  publishedAt: number;
}

interface SelectedNewsContext {
  point: MapPoint;
  news: MapNewsItem | null;
  opened: boolean;
}

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 60;
const MAP_NEWS_REFRESH_MS = 5 * 60 * 1000;
const LOCATION_STOPWORDS = new Set([
  "city",
  "region",
  "province",
  "state",
  "area",
  "north",
  "south",
  "east",
  "west",
  "new",
  "old",
]);

const isValidCoordinate = (lat: number, lon: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= -90 &&
  lat <= 90 &&
  lon >= -180 &&
  lon <= 180;

const projectToViewBox = (lon: number, lat: number) => ({
  x: ((lon + 180) / 360) * VIEWBOX_WIDTH,
  y: ((90 - lat) / 180) * VIEWBOX_HEIGHT,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toEpochMillis = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return parsed < 1_000_000_000_000 ? parsed * 1000 : parsed;
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenizeLocation = (value: string): string[] =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !LOCATION_STOPWORDS.has(token));

const isLikelyNavigableUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const normalizeNewsEntry = (
  raw: Record<string, unknown>,
  fallbackCategory: string,
): MapNewsItem | null => {
  const title = String(raw.title ?? "").trim();
  if (!title) {
    return null;
  }

  return {
    source: String(raw.source ?? "Unknown").trim() || "Unknown",
    title,
    link: String(raw.link ?? "#").trim() || "#",
    category: String(raw.category ?? fallbackCategory ?? "global")
      .toLowerCase()
      .trim(),
    publishedAt: toEpochMillis(raw.publishedAt),
  };
};

const normalizeNewsPayload = (payload: unknown): MapNewsItem[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const items: MapNewsItem[] = [];

  if (Array.isArray(payload.items)) {
    for (const entry of payload.items) {
      if (!isRecord(entry)) {
        continue;
      }
      const normalized = normalizeNewsEntry(entry, "global");
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

        const normalized = normalizeNewsEntry(entry, category);
        if (normalized) {
          items.push(normalized);
        }
      }
    }
  }

  const deduped = new Map<string, MapNewsItem>();
  for (const item of items) {
    const key = `${item.source}-${item.title}-${item.publishedAt}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 160);
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

const loadMapNews = async (): Promise<{ items: MapNewsItem[]; error: string | null }> => {
  const endpoints = [
    "/api/worldmonitor/news?variant=full&lang=en",
    "https://worldmonitor.app/api/news/v1/list-feed-digest?variant=full&lang=en",
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJsonWithTimeout(endpoint, 12000);
      const items = normalizeNewsPayload(payload);
      if (items.length > 0) {
        return { items, error: null };
      }
    } catch {
      continue;
    }
  }

  return {
    items: [],
    error: "Live news source unavailable for map click matching.",
  };
};

const findBestNewsForPoint = (point: MapPoint, newsItems: MapNewsItem[]): MapNewsItem | null => {
  if (newsItems.length === 0) {
    return null;
  }

  const city = normalizeText(point.city);
  const country = normalizeText(point.country);
  const cityTokens = tokenizeLocation(point.city);
  const countryTokens = tokenizeLocation(point.country);

  let bestItem: MapNewsItem | null = null;
  let bestScore = -1;

  for (const item of newsItems) {
    const title = normalizeText(item.title);
    if (!title) {
      continue;
    }

    let score = 0;

    if (city && title.includes(city)) score += 12;
    if (country && title.includes(country)) score += 10;

    for (const token of cityTokens) {
      if (title.includes(token)) {
        score += 3;
      }
    }

    for (const token of countryTokens) {
      if (title.includes(token)) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
      continue;
    }

    if (score === bestScore && bestItem && item.publishedAt > bestItem.publishedAt) {
      bestItem = item;
    }
  }

  if (bestItem && bestScore > 0) {
    return bestItem;
  }

  return newsItems[0] ?? null;
};

const ringToPath = (ring: Coordinate[]): string => {
  if (!Array.isArray(ring) || ring.length < 3) {
    return "";
  }

  const commands = ring
    .map((coordinate, index) => {
      const lon = coordinate[0];
      const lat = coordinate[1];

      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return "";
      }

      const projected = projectToViewBox(lon, lat);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(3)},${projected.y.toFixed(3)}`;
    })
    .filter(Boolean)
    .join(" ");

  return commands ? `${commands} Z` : "";
};

const polygonToPath = (polygon: Coordinate[][]): string =>
  polygon.map(ringToPath).filter(Boolean).join(" ");

interface WorldMapProps {
  activeLayerIds: string[];
}

const WorldMap = ({ activeLayerIds }: WorldMapProps) => {
  const [countries, setCountries] = useState<CountryGeoJson | null>(null);
  const [facilities, setFacilities] = useState<IrradiatorFacility[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [selectedNewsContext, setSelectedNewsContext] = useState<SelectedNewsContext | null>(null);
  const [newsItems, setNewsItems] = useState<MapNewsItem[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState("WorldMonitor");
  const [extractedDate, setExtractedDate] = useState("n/a");

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [countriesResponse, facilitiesResponse] = await Promise.all([
          fetch("/data/countries.geojson"),
          fetch("/data/gamma-irradiators.json"),
        ]);

        if (!countriesResponse.ok) {
          throw new Error(`countries.geojson failed (${countriesResponse.status})`);
        }

        if (!facilitiesResponse.ok) {
          throw new Error(`gamma-irradiators.json failed (${facilitiesResponse.status})`);
        }

        const countriesJson = (await countriesResponse.json()) as CountryGeoJson;
        const facilitiesJson = (await facilitiesResponse.json()) as IrradiatorDataset;

        if (!isActive) {
          return;
        }

        setCountries(countriesJson);
        setFacilities(Array.isArray(facilitiesJson.facilities) ? facilitiesJson.facilities : []);
        setSourceLabel(facilitiesJson.source ?? "WorldMonitor source");
        setExtractedDate(facilitiesJson.extracted ?? "n/a");
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load map source data.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncNews = async () => {
      const result = await loadMapNews();
      if (cancelled) {
        return;
      }

      setNewsItems(result.items);
      setNewsError(result.error);
    };

    void syncNews();
    const timer = window.setInterval(() => {
      void syncNews();
    }, MAP_NEWS_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const countryPaths = useMemo(() => {
    if (!countries) {
      return [];
    }

    const paths: string[] = [];

    for (const feature of countries.features) {
      const geometry = feature.geometry;
      if (!geometry) {
        continue;
      }

      if (geometry.type === "Polygon") {
        const path = polygonToPath(geometry.coordinates);
        if (path) {
          paths.push(path);
        }
      } else if (geometry.type === "MultiPolygon") {
        for (const polygon of geometry.coordinates) {
          const path = polygonToPath(polygon);
          if (path) {
            paths.push(path);
          }
        }
      }
    }

    return paths;
  }, [countries]);

  const mapPoints = useMemo<MapPoint[]>(
    () =>
      facilities
        .filter((facility) => isValidCoordinate(facility.lat, facility.lon))
        .map((facility) => {
          const projected = projectToViewBox(facility.lon, facility.lat);
          return {
            ...facility,
            x: projected.x,
            y: projected.y,
          };
        }),
    [facilities],
  );

  const activeLayerSet = useMemo(() => new Set(activeLayerIds), [activeLayerIds]);
  const showNuclearSites = activeLayerSet.has("nuclear-sites");

  useEffect(() => {
    if (!showNuclearSites) {
      setHoveredPoint(null);
      setSelectedNewsContext(null);
    }
  }, [showNuclearSites]);

  const handlePointClick = (point: MapPoint) => {
    const relatedNews = findBestNewsForPoint(point, newsItems);
    const canOpen = relatedNews ? isLikelyNavigableUrl(relatedNews.link) : false;

    if (relatedNews && canOpen) {
      window.open(relatedNews.link, "_blank", "noopener,noreferrer");
    }

    setSelectedNewsContext({
      point,
      news: relatedNews,
      opened: canOpen,
    });
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="hsl(142, 60%, 45%)"
              strokeWidth="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {countryPaths.map((path, index) => (
          <path
            key={`country-path-${index}`}
            d={path}
            fill="hsl(142, 30%, 12%)"
            fillOpacity={0.22}
            stroke="hsl(142, 50%, 45%)"
            strokeOpacity={0.5}
            strokeWidth="0.06"
            vectorEffect="non-scaling-stroke"
            fillRule="evenodd"
          />
        ))}

        {[10, 20, 30, 40, 50].map((latitudeY) => (
          <line
            key={`lat-${latitudeY}`}
            x1="0"
            y1={latitudeY}
            x2={VIEWBOX_WIDTH}
            y2={latitudeY}
            stroke="hsl(142, 60%, 45%)"
            strokeWidth="0.04"
            opacity="0.25"
            strokeDasharray="1,1"
          />
        ))}

        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((longitudeX) => (
          <line
            key={`lon-${longitudeX}`}
            x1={longitudeX}
            y1="0"
            x2={longitudeX}
            y2={VIEWBOX_HEIGHT}
            stroke="hsl(142, 60%, 45%)"
            strokeWidth="0.04"
            opacity="0.25"
            strokeDasharray="1,1"
          />
        ))}

        {showNuclearSites &&
          mapPoints.map((point) => (
            <g
              key={point.id}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => handlePointClick(point)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={0.95}
                fill="none"
                stroke="hsl(45, 90%, 55%)"
                strokeOpacity={0.45}
                strokeWidth={0.08}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={0.32}
                fill="hsl(45, 90%, 55%)"
                opacity={0.92}
              />
            </g>
          ))}
      </svg>

      {showNuclearSites && hoveredPoint && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 bg-card border border-panel-border rounded px-3 py-2 text-xs pointer-events-none"
          style={{
            left: `${(hoveredPoint.x / VIEWBOX_WIDTH) * 100}%`,
            top: `${(hoveredPoint.y / VIEWBOX_HEIGHT) * 100 - 6}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-display text-foreground">
            {hoveredPoint.city}, {hoveredPoint.country}
          </div>
          <div className="text-muted-foreground">
            lat {hoveredPoint.lat.toFixed(2)} | lon {hoveredPoint.lon.toFixed(2)}
          </div>
        </motion.div>
      )}

      {showNuclearSites && selectedNewsContext && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-20 w-[300px] max-w-[92vw] bg-card border border-panel-border rounded px-3 py-2"
          style={{
            left: `${(selectedNewsContext.point.x / VIEWBOX_WIDTH) * 100}%`,
            top: `${(selectedNewsContext.point.y / VIEWBOX_HEIGHT) * 100 - 10}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-display text-foreground text-[11px]">
                {selectedNewsContext.point.city}, {selectedNewsContext.point.country}
              </div>
              <div className="text-[9px] text-muted-foreground">
                lat {selectedNewsContext.point.lat.toFixed(2)} | lon{" "}
                {selectedNewsContext.point.lon.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => setSelectedNewsContext(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground leading-none"
              aria-label="Close related news popup"
            >
              x
            </button>
          </div>

          {selectedNewsContext.news ? (
            <div className="mt-2">
              <div className="text-[9px] text-muted-foreground">
                {selectedNewsContext.news.source} | {selectedNewsContext.news.category}
              </div>
              <div className="mt-1 text-[10px] text-foreground leading-tight">
                {selectedNewsContext.news.title}
              </div>

              {isLikelyNavigableUrl(selectedNewsContext.news.link) ? (
                <a
                  href={selectedNewsContext.news.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-[9px] text-tactical-amber hover:text-tactical-red"
                >
                  {selectedNewsContext.opened ? "Source opened. Open again" : "Open source link"}
                </a>
              ) : (
                <div className="mt-1 text-[9px] text-muted-foreground">Source link unavailable.</div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-[9px] text-muted-foreground">
              No related headline found for this coordinate.
            </div>
          )}
        </motion.div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-panel-border rounded px-3 py-2">
        <span className="text-[9px] text-muted-foreground font-display tracking-widest">
          PLOTTED DATA
        </span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[9px] text-muted-foreground">
            Gamma Irradiator Facilities ({showNuclearSites ? mapPoints.length : 0})
          </span>
          {!showNuclearSites && (
            <span className="text-[9px] text-muted-foreground/70">OFF</span>
          )}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-[8px] text-muted-foreground/70 text-right">
        <div>Source: {sourceLabel}</div>
        <div>Extracted: {extractedDate}</div>
      </div>

      {isLoading && (
        <div className="absolute top-3 left-3 bg-card/90 border border-panel-border rounded px-2 py-1 text-[10px] text-muted-foreground">
          Loading worldmonitor source data...
        </div>
      )}

      {error && (
        <div className="absolute top-3 right-3 bg-red-900/30 border border-red-500/50 rounded px-2 py-1 text-[10px] text-red-200 max-w-[320px]">
          {error}
        </div>
      )}

      {newsError && (
        <div className="absolute top-11 left-3 bg-amber-900/30 border border-amber-500/40 rounded px-2 py-1 text-[10px] text-amber-200 max-w-[340px]">
          {newsError}
        </div>
      )}
    </div>
  );
};

export default WorldMap;

