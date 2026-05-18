'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, RefreshCw, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { SessionTimeline } from './session-timeline';
import { AnalyzingStateCard } from './analyzing-state-card';
import { DiagnosisCard } from './diagnosis-card';
import { SessionStep, Diagnosis } from '@/lib/mock-data';
import { fetchSessionEvents, diagnoseRealSession, fetchLatestSessionId } from '@/lib/api';

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

type MonitorState = "INITIALIZING" | "LIVE" | "REPLAY" | "DEMO";

export function LiveSessionMonitor() {
  const [monitorState, setMonitorState] = useState<MonitorState>("INITIALIZING");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [events, setEvents] = useState<any[]>([]);
  const [fullTimeline, setFullTimeline] = useState<SessionStep[]>([]);
  const [visibleTimeline, setVisibleTimeline] = useState<SessionStep[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);

  const initTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    let foundLive = false;

    const checkLiveSession = async () => {
      const id = await fetchLatestSessionId();
      if (id) {
        const recentEvents = await fetchSessionEvents(id);
        const isAbandoned = recentEvents.some((e: any) => e.event_type === 'session_abandoned');
        
        if (!isAbandoned && recentEvents.length > 0) {
          foundLive = true;
          if (isMounted) {
            setMonitorState("LIVE");
            setActiveSessionId(id);
            setEvents(recentEvents);
            const mapped = mapEventsToTimeline(recentEvents);
            setFullTimeline(mapped);
            setVisibleTimeline(mapped);
          }
        }
      }
    };

    checkLiveSession();

    initTimerRef.current = setTimeout(async () => {
      if (!foundLive && isMounted) {
        const id = await fetchLatestSessionId();
        if (id) {
          setMonitorState("REPLAY");
          setActiveSessionId(id);
          const recentEvents = await fetchSessionEvents(id);
          setEvents(recentEvents);
          setFullTimeline(mapEventsToTimeline(recentEvents));
        } else {
          setMonitorState("DEMO");
          setActiveSessionId("demo-session-882a");
          
          const mockEvents = [
            { event_type: "page_view", timestamp: new Date(Date.now() - 60000).toISOString() },
            { event_type: "variant_changed", metadata: { variant_id: "Red / M" }, timestamp: new Date(Date.now() - 50000).toISOString() },
            { event_type: "shipping_section_viewed", timestamp: new Date(Date.now() - 40000).toISOString() },
            { event_type: "page_revisit", timestamp: new Date(Date.now() - 20000).toISOString() },
            { event_type: "session_abandoned", timestamp: new Date(Date.now() - 5000).toISOString() }
          ];
          setEvents(mockEvents);
          setFullTimeline(mapEventsToTimeline(mockEvents));
        }
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (initTimerRef.current) clearTimeout(initTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (monitorState === "LIVE" && activeSessionId) {
      pollIntervalRef.current = setInterval(async () => {
        const newEvents = await fetchSessionEvents(activeSessionId);
        if (newEvents && newEvents.length > 0) {
          setEvents(newEvents);
          const mapped = mapEventsToTimeline(newEvents);
          setFullTimeline(mapped);
          setVisibleTimeline(mapped);
          
          if (newEvents.some((e: any) => e.event_type === 'session_abandoned') && !isAnalyzing && !diagnosis) {
            handleAnalyze(activeSessionId, newEvents, mapped);
          }
        }
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [monitorState, activeSessionId, isAnalyzing, diagnosis]);

  useEffect(() => {
    if ((monitorState === "REPLAY" || monitorState === "DEMO") && fullTimeline.length > 0) {
      let currentIndex = 0;
      setVisibleTimeline([]);
      
      playbackIntervalRef.current = setInterval(() => {
        if (currentIndex < fullTimeline.length) {
          setVisibleTimeline(prev => [...prev, fullTimeline[currentIndex]]);
          currentIndex++;
        } else {
          if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
          
          if (!isAnalyzing && !diagnosis) {
            handleAnalyze(activeSessionId, events, fullTimeline);
          }
        }
      }, 800);
    }
    
    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [monitorState, fullTimeline]);

  const handleAnalyze = async (id: string | null = activeSessionId, evts: any[] = events, timelineData: SessionStep[] = fullTimeline) => {
    if (!id) return;
    setIsAnalyzing(true);
    
    let result: Diagnosis | null = null;
    
    if (monitorState === "DEMO") {
       const api = await import('@/lib/api');
       result = await api.submitLiveDiagnosis('SHIPPING_SURPRISE');
       finishAnalysis(result, evts, timelineData);
    } else {
       result = await diagnoseRealSession(id);
       finishAnalysis(result, evts, timelineData);
    }
  };

  const finishAnalysis = (result: Diagnosis | null, evts: any[], timelineData: SessionStep[]) => {
    if (result) {
      result.sessionTimeline = timelineData;
      if (evts.length > 0) {
        const lastEvent = evts[evts.length - 1];
        const maxCartValue = Math.max(...evts.map(e => e.cart_value || 0), 0);
        
        result.cartValue = result.cartValue || maxCartValue || 3499;
        result.abandonmentStep = result.abandonmentStep === 'Active' ? 
           (lastEvent.event_type === 'checkout_step_reached' ? (lastEvent.metadata?.step || 'checkout') : 'active') : result.abandonmentStep;
      }
      setDiagnosis(result);
    }
    setIsAnalyzing(false);
  };

  const getStatusText = () => {
    if (monitorState === "INITIALIZING") return "Listening for storefront telemetry...";
    if (monitorState === "LIVE") return "Analyzing live storefront behavior";
    if (monitorState === "REPLAY") return "Replaying recent behavioral telemetry";
    return "Demonstrating AI forensic analysis";
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center relative">
          <Activity className="w-5 h-5 text-primary" />
          {monitorState === "LIVE" && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Live Session Monitoring</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {getStatusText()}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 border border-primary/20 relative overflow-hidden shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]">
        
        {monitorState === "INITIALIZING" && (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground/30 mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {getStatusText()}
            </p>
          </div>
        )}

        {monitorState !== "INITIALIZING" && activeSessionId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">
                  Session: {activeSessionId.substring(0, 8)}...
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider">
                  {monitorState === "LIVE" && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                  {monitorState}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className={events.some(e => e.event_type === 'session_abandoned') ? 'text-destructive' : 'text-primary'}>
                  Status: {events.some(e => e.event_type === 'session_abandoned') ? 'Abandoned' : 'Active'}
                </span>
                <span>Events: {visibleTimeline.length} / {fullTimeline.length}</span>
              </div>
            </div>

            {visibleTimeline.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <SessionTimeline steps={visibleTimeline} />
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-muted-foreground/30 mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Preparing timeline...
                </p>
              </div>
            )}
          </div>
        )}

      </div>

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
