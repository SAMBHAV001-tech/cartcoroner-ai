'use client';

import { Brain, Activity, Shield, Search } from 'lucide-react';

export function AnalyzingStateCard() {
  return (
    <div className="forensic-card glass-card rounded-xl p-5 border border-primary/40 relative overflow-hidden mb-4 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]">
      {/* Scanning effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scan pointer-events-none" />
      <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center relative overflow-hidden">
              <Brain className="w-5 h-5 text-primary relative z-10 animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 animate-ping opacity-50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider animate-pulse">
                  Analyzing Behavioral Friction...
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scanning session payload across 42 friction vectors
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-primary">LIVE SCAN</span>
          </div>
        </div>

        {/* Fake skeleton elements that light up */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center animate-pulse">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="h-2 w-1/3 bg-muted/80 rounded animate-pulse" />
              <div className="h-2 w-1/4 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/30">
            {[Activity, Shield, Brain].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-1.5 opacity-50">
                <Icon className="w-3.5 h-3.5 text-primary animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                <div className="h-1 w-8 bg-primary/40 rounded" />
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-2 w-full bg-muted/50 rounded animate-pulse" />
            <div className="h-2 w-5/6 bg-muted/50 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="h-2 w-4/6 bg-muted/50 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
