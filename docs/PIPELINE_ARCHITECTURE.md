# World Monitor Pipeline Architecture

## 1) Runtime Flow

```text
[WorldMonitor API]
   |  news digest + youtube live status
   v
[Vite Proxy Layer]
   /api/worldmonitor/news
   /api/worldmonitor/youtube/live
   |
   v
[Client Data Pipeline]
   fetch -> timeout -> normalize -> dedupe -> cache/fallback
   |
   +--> LiveNewsPanel state
   |      - channel selector
   |      - live video resolver
   |      - severity + age filtering
   |
   +--> WorldMap state
          - facility points
          - news matching by city/country
          - click marker -> open source link
```

## 2) Layered Components

### Ingestion Layer
- `vite.config.ts`
- Proxy endpoint:
  - `/api/worldmonitor/news` -> `/api/news/v1/list-feed-digest`
  - `/api/worldmonitor/youtube/live` -> `/api/youtube/live`

### Processing Layer
- `src/components/dashboard/LiveNewsPanel.tsx`
  - Timeout fetch + fallback headlines
  - Deduplicate + sort by `publishedAt`
  - Filter by range: `6h | 24h | 7d`
  - Resolve live YouTube stream with cache
- `src/components/dashboard/WorldMap.tsx`
  - Fetch geojson + facility coordinates
  - Fetch live news for map click relevance
  - Match by `city/country` token score

### Presentation Layer
- `src/pages/Index.tsx`
  - Main viewport orchestration:
    - map center
    - right intelligence panel
    - live-news strip at bottom
- `src/lib/pipeline/dashboard-pipeline.ts`
  - Pipeline contract (step map + refresh interval constants)

## 3) Interaction Pipeline

### A. Live Video
1. User pilih channel.
2. Client call `/api/worldmonitor/youtube/live`.
3. Jika valid `videoId` -> render iframe live stream.
4. Jika gagal -> fallback `videoId` channel.
5. Refresh periodik tiap 2 menit.

### B. Live News
1. Client call `/api/worldmonitor/news`.
2. Normalize payload (`items` dan `categories.*.items`).
3. Dedupe + sort terbaru.
4. Terapkan filter waktu.
5. Render list headline dengan source link.

### C. Map Marker Click
1. User klik koordinat facility.
2. Client cari headline paling relevan dari news cache.
3. Popup menampilkan headline terpilih.
4. Source link dibuka otomatis (tab baru) jika URL valid.

## 4) Current Operational Notes
- News refresh interval: `5 menit`.
- Live status refresh interval: `2 menit`.
- YouTube status cache TTL: `5 menit`.
- Fallback mode aktif jika endpoint upstream tidak tersedia.

## 5) Next Refactor Targets
- Ekstrak seluruh fetch/normalize ke `src/lib/pipeline/` agar reusable lintas komponen.
- Tambah `useWorldMonitorPipeline` hook untuk menyatukan state news + live video.
- Tambah contract test untuk format payload API (news + youtube live).
