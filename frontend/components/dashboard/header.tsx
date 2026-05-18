'use client';

import { Activity, Bell, Search, Radio, Scan, ShieldAlert, TrendingDown, UserX, Lightbulb, LogOut, Download, Store, LayoutDashboard, User, X } from 'lucide-react';
import { AIStatusIndicator } from './metric-cards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Isolated to its own component so useSearchParams doesn't block the whole header
function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('q')?.toString() || '');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchValue(term);
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 w-64 hover:border-primary/30 transition-colors">
      <Search className="w-4 h-4 text-muted-foreground" />
      <input 
        type="text"
        placeholder="Search diagnoses..."
        onChange={handleSearch}
        value={searchValue}
        className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
      />
      {searchValue ? (
        <button onClick={clearSearch} className="p-0.5 hover:bg-muted rounded-full">
          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      ) : (
        <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">⌘K</kbd>
      )}
    </div>
  );
}

export function DashboardHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Logo Mark */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Activity className="w-5 h-5 text-primary-foreground" />
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 w-10 h-10 rounded-xl bg-primary/30 animate-ping opacity-20" />
              </div>
              
              {/* Brand Text */}
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  Cart<span className="text-primary">Coroner</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Behavioral Revenue Intelligence
                </p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-8 w-px bg-border/50 hidden md:block" />
            
            {/* Live Forensic Analysis Indicator */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">Live Analysis</span>
              </div>
              <div className="h-4 w-px bg-border/50" />
              <div className="flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-emerald-400 animate-data-pulse" />
                <span className="text-[10px] font-mono text-emerald-400">247 sessions</span>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-8 w-px bg-border/50 hidden lg:block" />
            
            {/* Shopify Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">S</span>
              </div>
              <span className="text-xs font-medium text-emerald-400">Shopify Connected</span>
            </div>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search — wrapped in Suspense so useSearchParams doesn't block render */}
            <Suspense fallback={
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 w-64">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground/50">Search diagnoses...</span>
              </div>
            }>
              <HeaderSearch />
            </Suspense>
            
            {/* AI Status */}
            <AIStatusIndicator analyzing={true} />
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative w-9 h-9 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center hover:border-primary/30 hover:bg-muted transition-all outline-none">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 border-border/50 bg-background/95 backdrop-blur-xl">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Behavioral Alerts</span>
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">4 New</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto py-2">
                  <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-red-500">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-foreground">High-risk shipping abandonment detected</p>
                        <p className="text-[10px] text-muted-foreground mt-1">₹45,000 cart abandoned at 12:45 PM. Estimated recovery impact: High.</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-blue-400">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Variant confusion spike in apparel</p>
                        <p className="text-[10px] text-muted-foreground mt-1">+41% increase in size-toggling behavior over the last 3 hours.</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-yellow-400">
                    <div className="flex items-start gap-3">
                      <UserX className="w-4 h-4 text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Trust-gap increase for new sellers</p>
                        <p className="text-[10px] text-muted-foreground mt-1">First-time visitors are spending 2x longer on return policy pages.</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-emerald-400">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Recovery opportunity identified</p>
                        <p className="text-[10px] text-muted-foreground mt-1">AI suggests lowering free-shipping threshold to ₹3000 to recover ₹1.2L.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            

            
            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center border border-primary/30 cursor-pointer hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all outline-none">
                  <span className="text-sm font-semibold text-primary-foreground">M</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-border/50 bg-background/95 backdrop-blur-xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Merchant Account</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">admin@cartcoroner.demo</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem className="cursor-pointer text-xs group">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Analyst Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-xs group">
                  <Store className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Shopify Store</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-xs group" onClick={() => toast.success('Report Generation Started', { description: 'Your export will be ready in a moment.' })}>
                  <Download className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Export Reports</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem className="cursor-pointer text-xs group">
                  <User className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-xs text-red-400 focus:text-red-400 focus:bg-red-400/10 group" onClick={() => toast.error('Logged out successfully.')}>
                  <LogOut className="mr-2 h-4 w-4 text-red-400" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
