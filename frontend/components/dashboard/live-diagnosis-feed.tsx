'use client';

import { useState } from 'react';
import { Diagnosis } from '@/lib/mock-data';
import { DiagnosisCard } from './diagnosis-card';
import { AnalyzingStateCard } from './analyzing-state-card';
import { submitLiveDiagnosis, SCENARIO_PAYLOADS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, AlertCircle, ShoppingBag, ShieldAlert, Users } from 'lucide-react';

interface LiveDiagnosisFeedProps {
  initialDiagnoses: Diagnosis[];
}

export function LiveDiagnosisFeed({ initialDiagnoses }: LiveDiagnosisFeedProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(initialDiagnoses);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (scenario: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    // Smooth scroll to top of feed
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Artificial delay for UI scanning effect (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await submitLiveDiagnosis(scenario);
    
    setIsAnalyzing(false);

    if (result) {
      setDiagnoses(prev => [result, ...prev]);
    } else {
      setError("Failed to fetch diagnosis from AI engine.");
    }
  };

  const scenarios = [
    { key: 'SHIPPING_SURPRISE', label: 'Shipping Drop-off', icon: ShoppingBag },
    { key: 'PRICE_SHOCK', label: 'Price Shock', icon: AlertCircle },
    { key: 'TRUST_GAP', label: 'Trust Issue', icon: ShieldAlert },
    { key: 'VARIANT_CONFUSION', label: 'Variant Confusion', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Live Simulation Controls */}
      <div className="glass-card rounded-xl p-4 border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary ml-0.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Live AI Demo <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Inject behavioral payloads into engine
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <Button 
                key={scenario.key}
                variant="outline" 
                size="sm" 
                className="text-xs gap-1.5 border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => handleSimulate(scenario.key)}
                disabled={isAnalyzing}
              >
                <Icon className="w-3.5 h-3.5" />
                {scenario.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Feed Content */}
      <div className="space-y-4 relative">
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {isAnalyzing && <AnalyzingStateCard />}

        {diagnoses.length > 0 ? (
          diagnoses.map((diagnosis) => (
            <DiagnosisCard key={diagnosis.id} diagnosis={diagnosis} />
          ))
        ) : (
          !isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-border/50 bg-muted/20">
              <h3 className="text-sm font-medium text-foreground">No diagnoses found</h3>
              <p className="text-xs text-muted-foreground mt-1">Inject a payload to see the AI in action.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
