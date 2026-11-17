'use client';

import React, { useState } from 'react';
import { Activity, Table, LineChart, AlertCircle } from 'lucide-react';

export interface TrendPoint {
  date: string;
  value: number;
  label?: string;
  visit_id?: string;
}

export interface ClinicalTrendLineProps {
  title: string;
  titleBn?: string;
  unit: string;
  data: TrendPoint[];
  color?: string; // e.g. '#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b'
  optimalRange?: [number, number];
  emptyMessage?: string;
  bn?: boolean;
}

export const ClinicalTrendLine: React.FC<ClinicalTrendLineProps> = ({
  title,
  titleBn,
  unit,
  data,
  color = '#10b981',
  optimalRange,
  emptyMessage,
  bn = false,
}) => {
  const [showTable, setShowTable] = useState(false);

  // Filter out invalid/NaN points and sort chronologically
  const validPoints = React.useMemo(() => {
    return (data || [])
      .filter(p => typeof p.value === 'number' && !isNaN(p.value))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const displayTitle = bn && titleBn ? titleBn : title;

  // Case 1: Zero data points
  if (validPoints.length === 0) {
    return (
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h4 className="font-bold text-xs text-foreground">{displayTitle}</h4>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">{unit}</span>
        </div>
        <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed text-muted-foreground space-y-1.5">
          <AlertCircle className="h-5 w-5 mx-auto opacity-40 text-muted-foreground" />
          <p className="text-xs">
            {emptyMessage || (bn ? 'কোনো মান রেকর্ড করা হয়নি।' : 'No recorded values across visits.')}
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Exactly 1 data point (honest display, no broken zero line)
  if (validPoints.length === 1) {
    const pt = validPoints[0];
    return (
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h4 className="font-bold text-xs text-foreground">{displayTitle}</h4>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">{unit}</span>
        </div>

        <div className="p-4 rounded-xl bg-muted/20 border flex flex-col items-center justify-center space-y-2 text-center">
          <div className="text-2xl font-extrabold text-foreground">
            {pt.value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {bn ? `তারিখ: ${pt.date}` : `Recorded on: ${pt.date}`}
          </div>
          <div className="px-3 py-1 rounded-full bg-secondary text-[11px] text-muted-foreground mt-1">
            {bn 
              ? 'ধারাবাহিক ট্রেন্ডরেখা প্রদর্শনের জন্য ন্যূনতম ২টি ভিজিটের মান আবশ্যক।'
              : 'At least 2 consultations required for multi-visit trendline visualization.'}
          </div>
        </div>
      </div>
    );
  }

  // Case 3: 2 or more data points -> Render honest SVG chart
  const svgWidth = 480;
  const svgHeight = 150;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 30;

  const innerWidth = svgWidth - padLeft - padRight;
  const innerHeight = svgHeight - padTop - padBottom;

  const values = validPoints.map(p => p.value);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  // If optimal range provided, ensure it fits in axis scale
  if (optimalRange) {
    minVal = Math.min(minVal, optimalRange[0]);
    maxVal = Math.max(maxVal, optimalRange[1]);
  }

  // If min and max are equal or too close, expand slightly
  if (minVal === maxVal) {
    minVal = minVal - 1;
    maxVal = maxVal + 1;
  }
  const valSpan = maxVal - minVal;
  const yMin = minVal - valSpan * 0.12;
  const yMax = maxVal + valSpan * 0.12;
  const yRange = yMax - yMin;

  // Calculate coordinates for each point
  const coords = validPoints.map((pt, i) => {
    const x = padLeft + (i / (validPoints.length - 1)) * innerWidth;
    const y = padTop + innerHeight - ((pt.value - yMin) / yRange) * innerHeight;
    return { x, y, pt };
  });

  // SVG path strings
  const linePathD = coords.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaPathD = `${linePathD} L ${coords[coords.length - 1].x} ${padTop + innerHeight} L ${coords[0].x} ${padTop + innerHeight} Z`;

  const gradientId = `trend-gradient-${displayTitle.replace(/\s+/g, '-').toLowerCase()}`;

  // Y-axis tick values (min, mid, max)
  const yTicks = [
    { label: maxVal.toFixed(1), y: padTop + innerHeight - ((maxVal - yMin) / yRange) * innerHeight },
    { label: ((minVal + maxVal) / 2).toFixed(1), y: padTop + innerHeight - ((((minVal + maxVal) / 2) - yMin) / yRange) * innerHeight },
    { label: minVal.toFixed(1), y: padTop + innerHeight - ((minVal - yMin) / yRange) * innerHeight },
  ];

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h4 className="font-bold text-xs text-foreground">{displayTitle}</h4>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground">
            {validPoints.length} {bn ? 'পয়েন্ট' : 'points'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTable(!showTable)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition text-[11px] flex items-center gap-1"
            title={showTable ? 'Switch to chart' : 'View data table'}
          >
            {showTable ? <LineChart className="h-3.5 w-3.5" /> : <Table className="h-3.5 w-3.5" />}
          </button>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">{unit}</span>
        </div>
      </div>

      {showTable ? (
        /* Tabular Data View */
        <div className="overflow-x-auto py-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground text-left text-[11px]">
                <th className="pb-1.5 font-medium">{bn ? 'ভিজিট তারিখ' : 'Visit Date'}</th>
                <th className="pb-1.5 font-medium">{bn ? 'পরিমাপ' : 'Value'}</th>
                <th className="pb-1.5 font-medium text-right">{bn ? 'পরিবর্তন' : 'Change from prev'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {validPoints.map((pt, idx) => {
                const prev = idx > 0 ? validPoints[idx - 1].value : null;
                const delta = prev !== null ? pt.value - prev : null;
                return (
                  <tr key={idx} className="hover:bg-muted/10">
                    <td className="py-1.5 font-semibold text-foreground">{pt.date}</td>
                    <td className="py-1.5 font-bold" style={{ color }}>{pt.value} {unit}</td>
                    <td className="py-1.5 text-right text-muted-foreground text-[11px]">
                      {delta !== null ? (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)) : 'Baseline'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Responsive SVG Chart View */
        <div className="w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-44"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={svgWidth - padRight}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={tick.y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="currentColor"
                  opacity="0.5"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPathD} fill={`url(#${gradientId})`} />

            {/* Main Trend Line */}
            <path
              d={linePathD}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Point nodes and labels */}
            {coords.map((c, i) => (
              <g key={i} className="group cursor-pointer">
                {/* Node circle */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="4.5"
                  fill="var(--background, #fff)"
                  stroke={color}
                  strokeWidth="2.5"
                />

                {/* Point value label */}
                <text
                  x={c.x}
                  y={c.y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="currentColor"
                >
                  {c.pt.value}
                </text>

                {/* Date label at bottom */}
                <text
                  x={c.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="currentColor"
                  opacity="0.6"
                >
                  {c.pt.date.length > 5 ? c.pt.date.slice(5) : c.pt.date}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};
