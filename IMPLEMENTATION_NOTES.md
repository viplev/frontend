# Issue #75 — Resource Usage Charts: Implementation Notes

## Status: Implementation Complete, Awaiting Review

All 6 todos are **done**. Lint + build pass. No tests to run (repo has none yet).

---

## What was done

### New file: `src/features/benchmarks/resourceCharting.ts`
All types and data-processing functions for resource charts:
- **Types**: `ResourceMetricKey`, `ResourceChartPoint`, `MultiSeriesResourcePoint`
- **Single-entity** (machine charts): `normalizeResourceDataPoints()`, `applyResourceSlidingAverage()`, `resolveResourceYAxisDomain()`
- **Multi-entity** (container charts): `mergeResourceSeries()`, `getMultiSeriesDataKeys()`, `applyMultiSeriesSlidingAverage()`, `resolveMultiSeriesYAxisDomain()`
- **Helper**: `computeDomain()` shared by both domain resolvers

### Modified: `src/features/benchmarks/BenchmarkRunResultsPage.tsx`
- Added `ResourceChart` component (reusable Recharts `LineChart` wrapper for resource data)
- Added `RESOURCE_SERIES_COLORS` palette and `ResourceLineConfig` interface
- Added `cpuTooltipFormatter` and `byteTooltipFormatter` (Recharts tooltip formatters)
- Added state: `resourceAxisScaleMode`, `resourceChartRenderMode`, `resourceSmoothingLevel`, `selectedServiceKeysByHost`
- Added `useEffect` to initialize per-host service selection (all selected by default)
- Added `processedHosts` useMemo — normalizes, smooths, merges chart data per host
- Added handlers: `handleToggleService`, `handleSelectAllServices`, `handleSelectNoServices`
- **Replaced** the old plain-text "Host resources" `<ul>` with interactive foldable `<details>` cards

### Modified: `src/App.css`
- Replaced `.run-results-host-list` styles with new classes:
  - `.run-results-host-card` / `-summary` / `-name` / `-stats`
  - `.run-results-host-machine-section` / `.run-results-host-container-section`
  - `.run-results-resource-grid` (2-col → 1-col responsive)
  - `.run-results-resource-chart-wrap` / `-title`
  - `.run-results-service-selector` / `.run-results-service-pill` / `.is-selected`

---

## Architecture & Key Decisions

### Layout
Each host gets a foldable `<details>` card:
- **Summary row**: host name + derived CPU avg, memory avg, net totals
- **Machine section**: 4 single-line charts (CPU%, Memory, Network I/O, Block I/O)
- **Container section**: service selector pills + 4 multi-line charts (one line per selected service)

### Data flow
```
rawData.timeSeries.hosts[].dataPoints → normalizeResourceDataPoints → applyResourceSlidingAverage → machinePoints
rawData.timeSeries.hosts[].services[].dataPoints → mergeResourceSeries → applyMultiSeriesSlidingAverage → container chart data
```

### Shared controls
One set of controls (axis scale mode, render mode, smoothing slider) governs ALL resource charts across ALL host cards on the page.

### Multi-series data key convention
Container chart dataKeys use `${serviceKey}_${metricKey}` (e.g., `nginx.1_cpuPercentage`).

### I/O chart conventions
- **Solid line** for "in" (read/receive), **dashed line** (`strokeDasharray: '5 3'`) for "out" (write/send)
- Same color per service entity

### Memory limit
When `memoryLimitBytes > 0`, a dashed reference line is shown on machine Memory charts.

### Network/block bytes
Values are **delta per sample interval** (not cumulative). No rate conversion is done.

---

## What's Next (Issue #76)

Issue #76 covers **resource usage comparison across runs** — same charts but on the comparison page (`BenchmarkRunComparisonPage`). That work would:
1. Create comparison-specific resource data processing (merge across runs)
2. Add resource charts to the comparison page following the same `ResourceChart` component
3. Allow selecting which runs to compare resource metrics for

---

## Validation Commands
```bash
npm run lint     # ESLint
npm run build    # tsc -b && vite build
npm run test     # vitest (currently no test files)
```

---

## Relevant Files
| File | Role |
|------|------|
| `src/features/benchmarks/resourceCharting.ts` | Data processing types & functions |
| `src/features/benchmarks/BenchmarkRunResultsPage.tsx` | Page component with charts |
| `src/App.css` | Styling |
| `src/features/benchmarks/charting.ts` | Reference: K6 chart patterns (similar structure) |
| `src/features/benchmarks/comparisonCharting.ts` | Reference: multi-entity merge pattern |
| `src/features/benchmarks/service.ts` | API calls (`getBenchmarkRunRaw`) |
| `openapi.yaml` | API schema for resource DTOs |
