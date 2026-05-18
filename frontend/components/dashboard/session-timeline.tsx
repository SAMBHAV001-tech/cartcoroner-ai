'use client';

import { SessionStep } from '@/lib/mock-data';
import { AlertCircle, Check, Clock } from 'lucide-react';

interface SessionTimelineProps {
  steps: SessionStep[];
}

export function SessionTimeline({ steps }: SessionTimelineProps) {
  return (
    <div className="relative pl-6">
      {/* Enhanced timeline line with glow */}
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent timeline-connector-enhanced" />
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="relative flex items-start gap-4 group">
            {/* Step indicator - Enhanced with glow */}
            <div className="relative z-10 flex-shrink-0 -ml-0.5">
              {step.highlight ? (
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-timeline-glow">
                    <AlertCircle className="w-3 h-3 text-primary-foreground" />
                  </div>
                  {/* Outer pulse ring */}
                  <div className="absolute -inset-1 rounded-full border border-primary/40 animate-ping" />
                  {/* Glow effect */}
                  <div className="absolute -inset-2 rounded-full bg-primary/20 blur-md" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 bg-background flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  {index === steps.length - 1 ? (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  ) : (
                    <Check className="w-2.5 h-2.5 text-muted-foreground/60" />
                  )}
                </div>
              )}
            </div>
            
            {/* Step content - Enhanced */}
            <div className="flex-1 min-w-0 -mt-0.5 pb-1">
              <div className={`flex items-center justify-between gap-2 p-2 rounded-md transition-all ${
                step.highlight 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'hover:bg-muted/30'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-medium truncate ${
                    step.highlight ? 'text-primary' : 'text-foreground/80'
                  }`}>
                    {step.action}
                  </span>
                  {step.highlight && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/20 text-primary rounded">
                      Friction
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {step.duration && (
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {step.duration}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {step.timestamp}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Connector glow for highlighted steps */}
            {step.highlight && (
              <div className="absolute left-0 top-0 -translate-x-1/4 w-10 h-10 bg-primary/15 rounded-full blur-xl" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function SessionTimelineCompact({ steps }: SessionTimelineProps) {
  const highlightedSteps = steps.filter(s => s.highlight);
  const keySteps = highlightedSteps.length > 0 ? highlightedSteps : steps.slice(-3);
  
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      {keySteps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
            step.highlight 
              ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_var(--glow-primary)]' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {step.highlight && <AlertCircle className="w-3 h-3" />}
            <span className="truncate max-w-[100px] font-medium">{step.action}</span>
          </div>
          {index < keySteps.length - 1 && (
            <div className="w-6 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
}
