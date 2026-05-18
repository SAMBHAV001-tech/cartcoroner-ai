'use client';

import { Diagnosis, rootCauseConfig } from '@/lib/mock-data';
import { SessionTimeline } from './session-timeline';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Mail, 
  Brain, 
  Sparkles,
  TrendingUp,
  ChevronRight,
  Clock,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Target
} from 'lucide-react';

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
}

// Behavioral signal chips configuration
const behaviorSignals: Record<string, { label: string; chipClass: string }> = {
  'shipping': { label: 'Shipping Hesitation', chipClass: 'signal-chip-friction' },
  'price': { label: 'Price Recheck', chipClass: 'signal-chip-payment' },
  'delivery': { label: 'Delivery Concern', chipClass: 'signal-chip-friction' },
  'trust': { label: 'Trust Validation', chipClass: 'signal-chip-trust' },
  'variant': { label: 'Variant Confusion', chipClass: 'signal-chip-variant' },
  'payment': { label: 'Payment Friction', chipClass: 'signal-chip-payment' },
  'size': { label: 'Size Uncertainty', chipClass: 'signal-chip-variant' },
  'review': { label: 'Review Checking', chipClass: 'signal-chip-trust' },
  'compare': { label: 'Price Comparison', chipClass: 'signal-chip-payment' },
  'exit': { label: 'Exit Intent', chipClass: 'signal-chip-friction' },
};

function detectBehaviorSignals(evidence: string[]): { label: string; chipClass: string }[] {
  const signals: { label: string; chipClass: string }[] = [];
  const evidenceText = evidence.join(' ').toLowerCase();
  
  if (evidenceText.includes('shipping') || evidenceText.includes('delivery')) {
    signals.push(behaviorSignals['shipping']);
  }
  if (evidenceText.includes('price') || evidenceText.includes('cost')) {
    signals.push(behaviorSignals['price']);
  }
  if (evidenceText.includes('trust') || evidenceText.includes('review')) {
    signals.push(behaviorSignals['trust']);
  }
  if (evidenceText.includes('size') || evidenceText.includes('variant') || evidenceText.includes('color')) {
    signals.push(behaviorSignals['variant']);
  }
  if (evidenceText.includes('payment') || evidenceText.includes('checkout')) {
    signals.push(behaviorSignals['payment']);
  }
  if (evidenceText.includes('exit') || evidenceText.includes('abandon')) {
    signals.push(behaviorSignals['exit']);
  }
  
  return signals.slice(0, 4); // Max 4 signals
}

function getRiskLevel(confidence: number, cartValue: number): { level: string; class: string; color: string } {
  if (confidence >= 90 && cartValue >= 15000) {
    return { level: 'CRITICAL', class: 'risk-critical', color: 'text-red-400' };
  } else if (confidence >= 80 || cartValue >= 10000) {
    return { level: 'HIGH', class: 'risk-high', color: 'text-orange-400' };
  } else if (confidence >= 65) {
    return { level: 'MEDIUM', class: 'risk-medium', color: 'text-yellow-400' };
  }
  return { level: 'LOW', class: 'risk-low', color: 'text-blue-400' };
}

function getEvidenceStrength(confidence: number): { label: string; color: string } {
  if (confidence >= 90) return { label: 'STRONG', color: 'text-emerald-400' };
  if (confidence >= 75) return { label: 'MODERATE', color: 'text-yellow-400' };
  return { label: 'WEAK', color: 'text-muted-foreground' };
}

export function DiagnosisCard({ diagnosis }: DiagnosisCardProps) {
  const causeConfig = rootCauseConfig[diagnosis.rootCause];
  const riskLevel = getRiskLevel(diagnosis.confidence, diagnosis.cartValue);
  const evidenceStrength = getEvidenceStrength(diagnosis.confidence);
  const behaviorChips = detectBehaviorSignals(diagnosis.behavioralEvidence);
  
  return (
    <div className="forensic-card glass-card rounded-xl p-5 hover-glow transition-all duration-300 group">
      {/* Forensic Header with Risk Indicators */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative">
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-data-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {diagnosis.customerEmail}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-foreground">
                ₹{diagnosis.cartValue.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-muted-foreground">
                • {diagnosis.productCategory}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{diagnosis.timestamp}</span>
          </div>
          {/* Risk Level Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${riskLevel.class}`}>
            <AlertTriangle className={`w-3 h-3 ${riskLevel.color}`} />
            <span className={`text-[10px] font-bold tracking-wider ${riskLevel.color}`}>
              {riskLevel.level} RISK
            </span>
          </div>
        </div>
      </div>
      
      {/* Forensic Intelligence Indicators Row */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Shield className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</span>
          </div>
          <span className={`text-xs font-bold ${evidenceStrength.color}`}>{evidenceStrength.label}</span>
        </div>
        <div className="text-center border-x border-border/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Match</span>
          </div>
          <span className="text-xs font-bold text-primary">{diagnosis.confidence >= 85 ? 'STRONG' : diagnosis.confidence >= 70 ? 'GOOD' : 'PARTIAL'}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Certainty</span>
          </div>
          <span className="text-xs font-bold text-foreground">{diagnosis.confidence}%</span>
        </div>
      </div>
      
      {/* Root Cause Badge & AI Confidence */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${causeConfig.bgColor} border border-current/20`}>
          <Brain className={`w-3.5 h-3.5 ${causeConfig.color}`} />
          <span className={`text-sm font-semibold ${causeConfig.color}`}>
            {causeConfig.label}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">AI Confidence</span>
            <span className="text-lg font-bold text-primary">{diagnosis.confidence}%</span>
          </div>
          <div className="w-12 h-12 relative">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                className="text-muted"
                strokeWidth="3"
                stroke="currentColor"
                fill="transparent"
                r="15.5"
                cx="18"
                cy="18"
              />
              <circle
                className="text-primary animate-timeline-glow"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="15.5"
                cx="18"
                cy="18"
                strokeDasharray={`${diagnosis.confidence} 100`}
                style={{ filter: 'drop-shadow(0 0 4px var(--primary))' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Behavioral Signal Chips - HIGH PRIORITY */}
      {behaviorChips.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Detected Behavioral Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {behaviorChips.map((chip, index) => (
              <span 
                key={index}
                className={`signal-chip px-2.5 py-1 rounded-md text-[11px] font-medium ${chip.chipClass}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Revenue Leak Indicator */}
      <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-destructive/80">Revenue Leak Detected</span>
            <p className="text-sm font-semibold text-destructive">{diagnosis.abandonmentStep}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-destructive/20">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] font-bold text-destructive">FRICTION POINT</span>
          </div>
        </div>
      </div>
      
      {/* Session Timeline - Signature Feature (Enhanced) */}
      <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-intelligence-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Behavioral Session Timeline
            </span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-medium text-primary">LIVE ANALYSIS</span>
          </div>
        </div>
        <SessionTimeline steps={diagnosis.sessionTimeline} />
      </div>
      
      {/* Behavioral Evidence */}
      <div className="mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
          Forensic Evidence Trail
        </span>
        <ul className="space-y-1.5">
          {diagnosis.behavioralEvidence.slice(0, 3).map((evidence, index) => (
            <li 
              key={index} 
              className="flex items-start gap-2 text-sm text-foreground/80 animate-evidence-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span>{evidence}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* AI Recommendation */}
      <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              AI Recovery Strategy
            </span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {diagnosis.aiRecommendation}
          </p>
        </div>
      </div>
      
      {/* Recovery Impact */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. Weekly Recovery Impact</span>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-lg font-bold text-emerald-400">
            ₹{diagnosis.weeklyRecoveryImpact.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}

// Compact card for list views
export function DiagnosisCardCompact({ diagnosis }: DiagnosisCardProps) {
  const causeConfig = rootCauseConfig[diagnosis.rootCause];
  const riskLevel = getRiskLevel(diagnosis.confidence, diagnosis.cartValue);
  
  return (
    <div className="forensic-card glass-card rounded-lg p-4 hover-glow transition-all duration-200 group cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${causeConfig.bgColor}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                ₹{diagnosis.cartValue.toLocaleString('en-IN')}
              </span>
              <Badge variant="outline" className={`text-xs ${causeConfig.color} ${causeConfig.bgColor} border-0`}>
                {causeConfig.label}
              </Badge>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${riskLevel.class} ${riskLevel.color}`}>
                {riskLevel.level}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {diagnosis.customerEmail} • {diagnosis.timestamp}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-sm font-bold text-primary">{diagnosis.confidence}%</span>
            <span className="text-xs text-muted-foreground block">confidence</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}
