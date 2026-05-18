'use client';

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookOpen, HelpCircle, Shield, CheckCircle2, Activity, Mail } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="border-t border-border/50 mt-12">
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Powered by CartCoroner AI
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-[10px] text-primary font-semibold">
              v2.4.1
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Documentation Modal */}
            <Dialog>
              <DialogTrigger asChild>
                <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors uppercase tracking-wider">
                  Documentation
                </span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Platform Documentation
                  </DialogTitle>
                  <DialogDescription>
                    Understanding the CartCoroner Behavioral Revenue Intelligence Engine.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Product Overview</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      CartCoroner is an AI-powered behavioral forensics platform designed for Shopify merchants. It doesn't just track that a cart was abandoned; it uses behavioral signals to diagnose <strong>why</strong> it was abandoned, calculating the exact root cause of friction.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Behavioral Diagnosis Engine</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our proprietary engine analyzes micro-interactions (hover patterns, hesitation timing, variant toggling, policy checks) in real-time. It maps these signals against our psychological heuristic models to output a high-confidence diagnosis.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Supported Root Causes</h3>
                    <ul className="grid grid-cols-2 gap-2 mt-2">
                      <li className="text-[11px] text-muted-foreground flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Shipping Surprise</li>
                      <li className="text-[11px] text-muted-foreground flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Price Shock</li>
                      <li className="text-[11px] text-muted-foreground flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Trust Gap</li>
                      <li className="text-[11px] text-muted-foreground flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Variant Confusion</li>
                      <li className="text-[11px] text-muted-foreground flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Just Browsing</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">AI Recovery Strategy Logic</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Recovery recommendations are generated using Llama-3 (via Groq). The AI synthesizes the diagnosis timeline and cart value to prescribe actionable merchant interventions that maximize recoverable revenue.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Shopify Integration</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      CartCoroner connects seamlessly via Shopify Webhooks. Payload data is processed instantly without adding scripts that slow down your storefront.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Open Source</h3>
                    <a href="https://github.com/SAMBHAV001-tech/cartcoroner-ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-primary hover:underline">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <BookOpen className="w-2.5 h-2.5 text-primary" />
                      </div>
                      View the Github Repository
                    </a>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Support Modal */}
            <Dialog>
              <DialogTrigger asChild>
                <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors uppercase tracking-wider">
                  Support
                </span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    Help & Support
                  </DialogTitle>
                  <DialogDescription>
                    System health and contact information.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium">Platform Uptime</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">99.99%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium">AI Monitoring</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium">Shopify Connection</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Healthy</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Team</h4>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=sambhavdas444@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
                      <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Email Support</p>
                        <p className="text-[10px] text-muted-foreground">sambhavdas444@gmail.com</p>
                      </div>
                    </a>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2">
                    <span>CartCoroner AI Agent</span>
                    <span className="font-mono">v2.4.1-stable</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Privacy Modal */}
            <Dialog>
              <DialogTrigger asChild>
                <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors uppercase tracking-wider">
                  Privacy
                </span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Privacy & Security
                  </DialogTitle>
                  <DialogDescription>
                    How we handle behavioral intelligence data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Anonymized Analytics</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        All behavioral tracking is completely anonymized. Emails are partially masked (e.g., user***@email.com) in the dashboard to protect consumer PII while still enabling retargeting integrations.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Behavioral Signal Processing</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        We only process front-end interactions (hovers, hesitation, scrolls) directly related to purchase intent friction. We do not log keystrokes outside of checkout flow inputs.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">No Payment Data Storage</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        CartCoroner does NOT intercept, process, or store payment credentials or credit card data. All financial transactions remain exclusively within Shopify's secure PCI-compliant infrastructure.
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </footer>
  );
}
