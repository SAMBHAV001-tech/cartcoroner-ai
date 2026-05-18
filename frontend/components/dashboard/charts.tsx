'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { 
  rootCauseDistribution, 
  abandonmentTrend, 
  revenueImpact 
} from '@/lib/mock-data';
import { TrendingDown, PieChartIcon, BarChart3 } from 'lucide-react';

const COLORS = [
  'oklch(0.72 0.2 55)',    // Orange - Shipping
  'oklch(0.65 0.25 25)',   // Red - Price Shock
  'oklch(0.78 0.18 90)',   // Yellow - Trust
  'oklch(0.65 0.2 240)',   // Blue - Variant
  'oklch(0.55 0.1 270)'    // Gray - Browsing
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 border border-border/50 shadow-xl">
        {label && <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">{label}</p>}
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium text-foreground">
            {entry.name}: <span className="text-primary">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function RootCauseChart() {
  return (
    <div className="glass-card rounded-xl p-5 chart-secondary transition-opacity duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <PieChartIcon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Root Cause Distribution</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI-detected abandonment patterns</p>
        </div>
      </div>
      
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rootCauseDistribution}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {rootCauseDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {rootCauseDistribution.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: COLORS[index], opacity: 0.8 }}
            />
            <span className="text-[10px] text-muted-foreground truncate">{entry.name}</span>
            <span className="text-[10px] font-medium text-foreground ml-auto">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AbandonmentTrendChart() {
  return (
    <div className="glass-card rounded-xl p-5 chart-secondary transition-opacity duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Abandonment vs Recovery</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Weekly cart behavior trends</p>
        </div>
      </div>
      
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={abandonmentTrend}>
            <defs>
              <linearGradient id="abandonedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.25 25)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="oklch(0.65 0.25 25)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.72 0.19 180)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="oklch(0.72 0.19 180)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.012 270)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
              axisLine={{ stroke: 'oklch(0.25 0.012 270)' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
              axisLine={{ stroke: 'oklch(0.25 0.012 270)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="abandoned"
              name="Abandoned"
              stroke="oklch(0.65 0.25 25)"
              fill="url(#abandonedGradient)"
              strokeWidth={1.5}
              strokeOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="recovered"
              name="Recovered"
              stroke="oklch(0.72 0.19 180)"
              fill="url(#recoveredGradient)"
              strokeWidth={1.5}
              strokeOpacity={0.7}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.25_25)] opacity-70" />
          <span className="text-[10px] text-muted-foreground">Abandoned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-70" />
          <span className="text-[10px] text-muted-foreground">Recovered</span>
        </div>
      </div>
    </div>
  );
}

export function RevenueImpactChart() {
  return (
    <div className="glass-card rounded-xl p-5 chart-secondary transition-opacity duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Revenue Impact by Category</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lost vs recoverable revenue</p>
        </div>
      </div>
      
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueImpact} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.012 270)" horizontal={false} opacity={0.5} />
            <XAxis 
              type="number" 
              tick={{ fontSize: 9, fill: 'oklch(0.55 0 0)' }}
              axisLine={{ stroke: 'oklch(0.25 0.012 270)' }}
              tickFormatter={(value) => `₹${(value / 1000)}k`}
            />
            <YAxis 
              dataKey="category" 
              type="category" 
              tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
              axisLine={{ stroke: 'oklch(0.25 0.012 270)' }}
              width={75}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="lost" 
              name="Lost Revenue" 
              fill="oklch(0.65 0.25 25 / 0.5)" 
              radius={[0, 4, 4, 0]}
            />
            <Bar 
              dataKey="recoverable" 
              name="Recoverable" 
              fill="oklch(0.72 0.19 180 / 0.7)" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.25_25_/_0.5)]" />
          <span className="text-[10px] text-muted-foreground">Lost Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-70" />
          <span className="text-[10px] text-muted-foreground">Recoverable</span>
        </div>
      </div>
    </div>
  );
}
