import { DashboardHeader } from '@/components/dashboard/header';
import { MetricCard } from '@/components/dashboard/metric-cards';
import { AIInsightsPanel } from '@/components/dashboard/insights-panel';
import { LiveDiagnosisFeed } from '@/components/dashboard/live-diagnosis-feed';
import { LiveSessionMonitor } from '@/components/dashboard/live-session-monitor';
import { 
  RootCauseChart, 
  AbandonmentTrendChart, 
  RevenueImpactChart 
} from '@/components/dashboard/charts';
import { 
  mockDiagnoses, 
  mockMetrics, 
  mockInsights 
} from '@/lib/mock-data';
import { 
  Brain, 
  Filter, 
  RefreshCw,
  Sparkles,
  ChevronDown,
  Activity,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchDiagnoses } from '@/lib/api';

import { DashboardFooter } from '@/components/dashboard/footer';

export const dynamic = 'force-dynamic';

export default async function Dashboard(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';

  const metricSeverities: ('normal' | 'warning' | 'critical')[] = ['critical', 'warning', 'normal', 'normal'];
  
  const liveDiagnoses = await fetchDiagnoses();
  const baseDiagnoses = liveDiagnoses && liveDiagnoses.length > 0 ? liveDiagnoses : mockDiagnoses;
  
  const displayDiagnoses = q 
    ? baseDiagnoses.filter(d => {
        const email = d.customerEmail || '';
        const cause = d.rootCause || '';
        const category = d.productCategory || '';
        return email.toLowerCase().includes(q) || 
               cause.toLowerCase().includes(q) ||
               category.toLowerCase().includes(q);
      })
    : baseDiagnoses;
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Live Forensic Analysis Banner */}
        <section className="mb-6">
          <div className="glass-card rounded-xl p-4 border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Activity className="w-5 h-5 text-primary" />
                    <div className="absolute -inset-1 bg-primary/30 rounded-full blur-sm animate-pulse" />
                  </div>
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">Live Forensic Analysis</span>
                </div>
                <div className="h-4 w-px bg-border/50" />
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span><span className="font-bold text-red-400">23</span> critical leaks detected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span><span className="font-bold text-emerald-400">89%</span> detection accuracy</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">Last scan:</span>
                <span className="font-mono text-foreground">12 seconds ago</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </section>
        
        {/* Metrics Row */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockMetrics.map((metric, index) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                trend={metric.trend}
                subtitle={metric.subtitle}
                delay={index * 100}
                severity={metricSeverities[index]}
              />
            ))}
          </div>
        </section>
        
        {/* Main Content Area */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          {/* Left Side - Diagnosis Feed */}
          <div>
            {/* Live Session Monitoring */}
            <LiveSessionMonitor />

            {/* Feed Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center relative">
                  <Brain className="w-5 h-5 text-primary" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Behavioral Intelligence Feed
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    AI-powered forensic diagnoses of cart abandonments
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filter</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
            
            {/* Live indicator */}
            <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 w-fit">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-intelligence-pulse" />
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  Live feed
                </span>
              </div>
              <div className="h-3 w-px bg-border/50" />
              <span className="text-[10px] font-mono text-muted-foreground">
                1,847 active diagnoses
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            
            {/* Live Diagnosis Feed */}
            <div className="mb-8">
              <LiveDiagnosisFeed initialDiagnoses={displayDiagnoses} />
            </div>
            
            {/* Charts Section */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-lg font-semibold text-foreground">
                  Analytics Overview
                </h3>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-muted/50 rounded">
                  Secondary
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <RootCauseChart />
                <AbandonmentTrendChart />
              </div>
              <RevenueImpactChart />
            </div>
          </div>
          
          {/* Right Sidebar - AI Insights */}
          <div className="xl:sticky xl:top-24 xl:self-start">
            <AIInsightsPanel insights={mockInsights} />
          </div>
        </section>
      </main>
      
      <DashboardFooter />
    </div>
  );
}
