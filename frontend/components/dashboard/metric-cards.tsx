'use client';

import { Activity, TrendingUp, TrendingDown, Zap, Brain } from 'lucide-react';

interface AIStatusIndicatorProps {
  analyzing?: boolean;
}

export function AIStatusIndicator({ analyzing = true }: AIStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 relative overflow-hidden">
      <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
      <div className="relative flex items-center gap-2 z-10">
        <div className="relative">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <div className="absolute -inset-1 bg-primary/30 rounded-full blur-sm animate-pulse" />
        </div>
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          {analyzing ? 'Analyzing' : 'Ready'}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  subtitle?: string;
  delay?: number;
  severity?: 'normal' | 'warning' | 'critical';
}

export function MetricCard({ title, value, change, trend, subtitle, delay = 0, severity = 'normal' }: MetricCardProps) {
  const isPositive = trend === 'up';
  
  const severityGlow = {
    normal: 'group-hover:shadow-[0_0_30px_var(--glow-primary)]',
    warning: 'group-hover:shadow-[0_0_30px_var(--glow-warning)]',
    critical: 'group-hover:shadow-[0_0_30px_var(--glow-destructive)]'
  };
  
  return (
    <div 
      className={`forensic-card glass-card rounded-xl p-5 hover-glow transition-all duration-300 group relative overflow-hidden ${severityGlow[severity]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {title}
        </span>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
          isPositive 
            ? 'text-emerald-400 bg-emerald-500/10' 
            : 'text-red-400 bg-red-500/10'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{change}%</span>
        </div>
      </div>
      
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
          {value}
        </span>
        {severity !== 'normal' && (
          <Zap className={`w-4 h-4 ${severity === 'critical' ? 'text-red-400' : 'text-orange-400'} animate-pulse`} />
        )}
      </div>
      
      {subtitle && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{subtitle}</span>
      )}
      
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface IntelligencePulseProps {
  size?: 'sm' | 'md' | 'lg';
}

export function IntelligencePulse({ size = 'md' }: IntelligencePulseProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <Activity className="w-full h-full text-primary animate-pulse" />
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-intelligence-pulse" />
    </div>
  );
}
