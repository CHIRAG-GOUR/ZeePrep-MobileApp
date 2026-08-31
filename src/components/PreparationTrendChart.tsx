/**
 * ZeePrep — Preparation Trend Chart
 * Cross-platform (native + web) SVG chart showing a student's board-preparation
 * progression for one subject: actual assessment scores vs predicted board score
 * over time, with a likely-range band. Animated line-draw, tap/hover tooltips.
 *
 * The SAME data drives both platforms; layout differs (mobile-first vs desktop).
 */
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Svg, { Path, Circle, Line, Polygon, Text as SvgText, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { ZEEPREP_THEME as T } from "../constants/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface TrendSeriesPoint {
  date: string;
  value: number; // 0-100
}

export interface PreparationTrendChartProps {
  /** Actual deterministic assessment scores over time (chronological). */
  actualSeries: TrendSeriesPoint[];
  /** Forecast-over-time (how the predicted board score itself moved). */
  predictedSeries?: TrendSeriesPoint[];
  /** Current forecast + likely range (drawn as the leading edge). */
  predictedPercentage?: number;
  range?: { min: number; max: number };
  variant?: "mobile" | "web";
  width: number;
  animated?: boolean;
}

const C = {
  actual: T.colors.primary, // indigo
  predicted: T.colors.warning, // amber
  band: "rgba(245, 158, 11, 0.14)",
  grid: "#E2E8F0",
  axisText: "#94A3B8",
  surface: "#FFFFFF",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function polylineLength(pts: { x: number; y: number }[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return Math.max(1, len);
}

function toPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
}

export default function PreparationTrendChart(props: PreparationTrendChartProps) {
  const {
    actualSeries,
    predictedSeries = [],
    predictedPercentage,
    range,
    variant = "mobile",
    width,
    animated = true,
  } = props;

  const isWeb = variant === "web";
  const height = isWeb ? 300 : 220;
  const pad = { l: 36, r: 16, t: 18, b: isWeb ? 34 : 30 };
  const plotW = Math.max(40, width - pad.l - pad.r);
  const plotH = Math.max(40, height - pad.t - pad.b);

  const [selected, setSelected] = useState<number | null>(null);

  // Build a combined x-axis over the union of assessments.
  const n = Math.max(actualSeries.length, predictedSeries.length);

  const scaleX = (i: number) => pad.l + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const scaleY = (v: number) => pad.t + (1 - Math.min(100, Math.max(0, v)) / 100) * plotH;

  const actualPts = useMemo(
    () => actualSeries.map((p, i) => ({ x: scaleX(i), y: scaleY(p.value), v: p.value, date: p.date })),
    [actualSeries, width, height]
  );
  const predPts = useMemo(
    () => predictedSeries.map((p, i) => ({ x: scaleX(i), y: scaleY(p.value), v: p.value, date: p.date })),
    [predictedSeries, width, height]
  );

  const actualPath = toPath(actualPts);
  const predPath = toPath(predPts);
  const actualLen = polylineLength(actualPts);
  const predLen = polylineLength(predPts);

  // Animation: draw lines left-to-right.
  const progress = useSharedValue(animated ? 0 : 1);
  React.useEffect(() => {
    if (animated) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [actualPath, predPath, animated]);

  const actualAnim = useAnimatedProps(() => ({
    strokeDashoffset: actualLen * (1 - progress.value),
  }));
  const predAnim = useAnimatedProps(() => ({
    strokeDashoffset: predLen * (1 - progress.value),
  }));

  const gridVals = [0, 25, 50, 75, 100];

  // Range band polygon around the leading predicted edge (or across predicted line).
  const bandPolygon = useMemo(() => {
    if (!range || predPts.length === 0) return "";
    const top = predPts.map((p) => `${p.x.toFixed(1)},${scaleY(range.max).toFixed(1)}`);
    const bot = predPts.map((p) => `${p.x.toFixed(1)},${scaleY(range.min).toFixed(1)}`).reverse();
    // Simpler: a horizontal band at the latest predicted range across the plot right portion.
    const lastX = predPts[predPts.length - 1].x;
    const firstX = predPts.length > 1 ? predPts[Math.max(0, predPts.length - 3)].x : pad.l;
    return `${firstX},${scaleY(range.max)} ${lastX},${scaleY(range.max)} ${lastX},${scaleY(range.min)} ${firstX},${scaleY(range.min)}`;
  }, [range, predPts, width, height]);

  const sel = selected != null ? { actual: actualPts[selected], pred: predPts[selected] } : null;

  return (
    <Animated.View entering={animated ? FadeIn.duration(350) : undefined} style={[styles.wrap, { width }]}>
      <Svg width={width} height={height}>
        {/* gridlines + y labels */}
        {gridVals.map((g) => {
          const y = scaleY(g);
          return (
            <G key={`g${g}`}>
              <Line x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke={C.grid} strokeWidth={1} />
              <SvgText x={pad.l - 8} y={y + 3} fontSize={isWeb ? 11 : 9} fill={C.axisText} textAnchor="end">
                {g}
              </SvgText>
            </G>
          );
        })}

        {/* range band */}
        {bandPolygon ? <Polygon points={bandPolygon} fill={C.band} /> : null}

        {/* predicted (dashed) */}
        {predPts.length > 1 && (
          <AnimatedPath
            animatedProps={predAnim}
            d={predPath}
            stroke={C.predicted}
            strokeWidth={isWeb ? 3 : 2.5}
            strokeDasharray={`6 5`}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* actual (solid) — drawn with dash reveal */}
        {actualPts.length > 1 && (
          <AnimatedPath
            animatedProps={actualAnim}
            d={actualPath}
            stroke={C.actual}
            strokeWidth={isWeb ? 3.5 : 3}
            strokeDasharray={`${actualLen} ${actualLen}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* predicted dots (hollow) */}
        {predPts.map((p, i) => (
          <Circle key={`pd${i}`} cx={p.x} cy={p.y} r={isWeb ? 4.5 : 3.5} fill={C.surface} stroke={C.predicted} strokeWidth={2} />
        ))}
        {/* latest-point emphasis halo */}
        {actualPts.length > 0 && (
          <Circle
            cx={actualPts[actualPts.length - 1].x}
            cy={actualPts[actualPts.length - 1].y}
            r={isWeb ? 11 : 9}
            fill="rgba(79,70,229,0.14)"
          />
        )}
        {/* actual dots (filled) */}
        {actualPts.map((p, i) => (
          <Circle
            key={`ad${i}`}
            cx={p.x}
            cy={p.y}
            r={selected === i ? (isWeb ? 7 : 6) : isWeb ? 5 : 4}
            fill={C.actual}
            stroke={C.surface}
            strokeWidth={2}
          />
        ))}

        {/* x labels */}
        {actualPts.map((p, i) => {
          if (n > 6 && i % Math.ceil(n / 6) !== 0 && i !== n - 1) return null;
          return (
            <SvgText key={`xl${i}`} x={p.x} y={height - pad.b + (isWeb ? 20 : 16)} fontSize={isWeb ? 11 : 9} fill={C.axisText} textAnchor="middle">
              {fmtDate(p.date)}
            </SvgText>
          );
        })}
      </Svg>

      {/* Tap / hover hit targets for tooltips */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {actualPts.map((p, i) => (
          <Pressable
            key={`hit${i}`}
            onPress={() => setSelected(selected === i ? null : i)}
            onHoverIn={Platform.OS === "web" ? () => setSelected(i) : undefined}
            onHoverOut={Platform.OS === "web" ? () => setSelected(null) : undefined}
            style={{
              position: "absolute",
              left: p.x - 16,
              top: p.y - 16,
              width: 32,
              height: 32,
            }}
          />
        ))}
      </View>

      {/* Tooltip */}
      {sel && sel.actual && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.min(Math.max(4, sel.actual.x - 70), width - 148),
              top: Math.max(2, sel.actual.y - (sel.pred ? 74 : 56)),
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.tooltipDate}>{fmtDate(sel.actual.date)}</Text>
          <View style={styles.tooltipRow}>
            <View style={[styles.dot, { backgroundColor: C.actual }]} />
            <Text style={styles.tooltipText}>Assessment {sel.actual.v}%</Text>
          </View>
          {sel.pred && (
            <View style={styles.tooltipRow}>
              <View style={[styles.dotHollow, { borderColor: C.predicted }]} />
              <Text style={styles.tooltipText}>Predicted {sel.pred.v}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: C.actual }]} />
          <Text style={styles.legendText}>Assessment score</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dotHollow, { borderColor: C.predicted }]} />
          <Text style={styles.legendText}>Predicted board</Text>
        </View>
        {range && (
          <View style={styles.legendItem}>
            <View style={styles.bandSwatch} />
            <Text style={styles.legendText}>Likely range</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "center" },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 11, color: T.colors.textSecondary, fontWeight: "600" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotHollow: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: "#FFFFFF" },
  bandSwatch: { width: 14, height: 10, borderRadius: 3, backgroundColor: "rgba(245, 158, 11, 0.28)" },
  tooltip: {
    position: "absolute",
    width: 144,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 3,
  },
  tooltipDate: { color: "#CBD5E1", fontSize: 10, fontWeight: "700", marginBottom: 2 },
  tooltipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tooltipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
});
