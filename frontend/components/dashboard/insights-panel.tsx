'use client';

import { AIInsight } from '@/lib/mock-data';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  BarChart3,
  Radio,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InsightCardProps {
  insight: AIInsight;
  index: number;
}

function InsightCard({ insight, index }: InsightCardProps) {
  const impactConfig = {
    high: { color: 'text-red-400', bg: 'bg-red-500/20', borderColor: 'border-red-500/30', icon: AlertTriangle },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30', icon: Zap },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/20', borderColor: 'border-blue-500/30', icon: TrendingUp }
  };
  
  const config = impactConfig[insight.impact];
  const Icon = config.icon;
  
  return (
    <div 
      className="forensic-card p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer animate-evidence-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.borderColor} border flex items-center justify-center flex-shrink-0 relative`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${config.bg} animate-pulse`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 leading-relaxed mb-2">
            {insight.insight}
          </p>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px] bg-muted/50 uppercase tracking-wider">
              {insight.category}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Confidence:</span>
              <span className="text-[10px] font-bold text-primary">{insight.confidence}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AIInsightsPanelProps {
  insights: AIInsight[];
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  return (
    <div className="glass-card rounded-xl p-5 h-full relative overflow-hidden">
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center relative live-indicator">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Intelligence</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Real-time behavioral patterns</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
          <Radio className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Live</span>
        </div>
      </div>
      
      {/* Live Analysis Indicator */}
      <div className="mb-4 p-2 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Scanning behavioral patterns...</span>
        </div>
        <span className="text-[10px] font-mono text-primary">12 sessions/min</span>
      </div>
      
      {/* Insights List */}
      <div className="space-y-3 mb-5 relative z-10">
        {insights.map((insight, index) => (
          <InsightCard key={insight.id} insight={insight} index={index} />
        ))}
      </div>
      
      {/* Quick Stats - Friction Heatmap */}
      <div className="pt-4 border-t border-border/50 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Friction Heatmap
          </h4>
          <span className="text-[9px] text-primary px-1.5 py-0.5 bg-primary/10 rounded">Live</span>
        </div>
        <div className="space-y-2.5">
          <FrictionBar label="Shipping Page" value={67} severity="critical" />
          <FrictionBar label="Payment Selection" value={45} severity="high" />
          <FrictionBar label="Address Entry" value={32} severity="medium" />
          <FrictionBar label="Cart Review" value={18} severity="low" />
        </div>
      </div>
      
      {/* Pattern Summary */}
      <div className="mt-5 p-3 rounded-lg bg-primary/5 border border-primary/20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Pattern Summary</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            Shipping-related friction accounts for <span className="font-bold text-destructive">42%</span> of all abandonments this week. 
            Consider implementing real-time shipping cost preview on product pages.
          </p>
        </div>
      </div>
    </div>
  );
}

interface FrictionBarProps {
  label: string;
  value: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

function FrictionBar({ label, value, severity }: FrictionBarProps) {
  const severityConfig = {
    critical: { color: 'bg-red-500', textColor: 'text-red-400', glow: 'shadow-[0_0_8px_oklch(0.65_0.25_25_/_0.5)]' },
    high: { color: 'bg-orange-500', textColor: 'text-orange-400', glow: 'shadow-[0_0_6px_oklch(0.72_0.2_55_/_0.4)]' },
    medium: { color: 'bg-yellow-500', textColor: 'text-yellow-400', glow: '' },
    low: { color: 'bg-blue-500', textColor: 'text-blue-400', glow: '' }
  };
  
  const config = severityConfig[severity];
  
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-[10px] text-muted-foreground w-28 truncate group-hover:text-foreground transition-colors">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={`h-full rounded-full ${config.color} ${config.glow} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold w-8 text-right ${config.textColor}`}>{value}%</span>
    </div>
  );
}
