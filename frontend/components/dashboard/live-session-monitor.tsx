'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Play, StopCircle, RefreshCw, Brain, Search, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SessionTimeline } from './session-timeline';
import { AnalyzingStateCard } from './analyzing-state-card';
import { DiagnosisCard } from './diagnosis-card';
import { SessionStep, Diagnosis } from '@/lib/mock-data';
import { fetchSessionEvents, diagnoseRealSession } from '@/lib/api';

function mapEventsToTimeline(events: any[]): SessionStep[] {
  return events.map((e, index) => {
    let action = e.event_type;
    let highlight = false;

    if (e.event_type === 'variant_changed') {
      action = `Variant Selected: ${e.metadata?.variant_id || 'Unknown'}`;
    } else if (e.event_type === 'shipping_section_viewed') {
      action = 'Viewed Shipping Rates';
    } else if (e.event_type === 'checkout_step_reached') {
      action = `Reached Checkout Step: ${e.metadata?.step || 'Unknown'}`;
    } else if (e.event_type === 'page_revisit') {
      action = 'Revisited Page';
      highlight = true;
    } else if (e.event_type === 'session_abandoned') {
      action = 'Session Abandoned';
      highlight = true;
    }

    return {
      action,
      timestamp: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      highlight
    };
  });
}

export function LiveSessionMonitor() {
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<SessionStep[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = (id: string) => {
    setActiveSessionId(id);
    setIsPolling(true);
    setDiagnosis(null);
    setEvents([]);
    setTimeline([]);
    
    // Initial fetch
    fetchData(id);

    pollIntervalRef.current = setInterval(() => {
      fetchData(id);
    }, 3000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setIsPolling(false);
  };

  const fetchData = async (id: string) => {
    const newEvents = await fetchSessionEvents(id);
    if (newEvents && newEvents.length > 0) {
      setEvents(newEvents);
      setTimeline(mapEventsToTimeline(newEvents));
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleAnalyze = async () => {
    if (!activeSessionId) return;
    setIsAnalyzing(true);
    const result = await diagnoseRealSession(activeSessionId);
    if (result) {
      // Attach the real timeline we built to the diagnosis result
      result.sessionTimeline = timeline;
      
      // Attempt to extract better metadata from events for the diagnosis card
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        const firstEvent = events[0];
        const maxCartValue = Math.max(...events.map(e => e.cart_value || 0), 0);
        
        result.cartValue = maxCartValue;
        result.abandonmentStep = lastEvent.event_type === 'checkout_step_reached' 
          ? (lastEvent.metadata?.step || 'checkout') 
          : 'active';
        result.timestamp = new Date(lastEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // If it's real data from the tracker, the payload doesn't always have email/category directly in events unless we pass it, 
        // but we'll use placeholder or what's available
      }
      
      setDiagnosis(result);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center relative">
          <Activity className="w-5 h-5 text-primary" />
          {isPolling && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Live Session Monitoring</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Connect to active Shopify storefront telemetry
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 border border-primary/20 relative overflow-hidden shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]">
        
        {/* Input Form */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Paste Shopify Session ID (from localStorage or console)..." 
              className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/30"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              disabled={isPolling || isAnalyzing}
            />
          </div>
          <div className="flex items-center gap-2">
            {!isPolling ? (
              <Button 
                onClick={() => startPolling(sessionIdInput)} 
                disabled={!sessionIdInput || isAnalyzing}
                className="gap-2 w-full sm:w-auto"
              >
                <Wifi className="w-4 h-4" />
                Connect
              </Button>
            ) : (
              <Button 
                onClick={stopPolling} 
                variant="destructive"
                className="gap-2 w-full sm:w-auto bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
              >
                <StopCircle className="w-4 h-4" />
                Stop Polling
              </Button>
            )}
          </div>
        </div>

        {/* Live Timeline Area */}
        {activeSessionId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">ID: {activeSessionId}</span>
                {isPolling && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {events.length} Events Captured
              </div>
            </div>

            {timeline.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <SessionTimeline steps={timeline} />
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <RefreshCw className={`w-8 h-8 text-muted-foreground/30 mb-3 ${isPolling ? 'animate-spin' : ''}`} />
                <p className="text-sm text-muted-foreground">
                  {isPolling ? 'Listening for storefront events...' : 'No events found for this session.'}
                </p>
              </div>
            )}

            {/* Analysis Action */}
            {timeline.length > 0 && !diagnosis && (
              <div className="pt-4 flex justify-center">
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  size="lg"
                  className="w-full sm:w-auto gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                >
                  <Brain className={`w-5 h-5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                  {isAnalyzing ? 'Initiating Groq Analysis...' : 'Analyze Behavioral Friction'}
                </Button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Analysis Results Area */}
      {isAnalyzing && (
        <div className="mt-6">
          <AnalyzingStateCard />
        </div>
      )}

      {diagnosis && !isAnalyzing && (
        <div className="mt-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Groq Behavioral Diagnosis</h3>
          </div>
          <DiagnosisCard diagnosis={diagnosis} />
        </div>
      )}
    </div>
  );
}
