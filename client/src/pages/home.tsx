import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, History, Plus, ChevronRight, Zap, Lock, Globe, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { SecurityScanForm } from "@/components/security-scan-form";
import { ScanProgress } from "@/components/scan-progress";
import { ScanResults } from "@/components/scan-results";
import { TechnologyTracker } from "@/components/technology-tracker";
import type { SecurityScan } from "@shared/schema";
import { format } from "date-fns";

type ViewState = 
  | { type: "form" }
  | { type: "progress"; scanId: string }
  | { type: "results"; scanId: string };

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>({ type: "form" });

  const { data: scans } = useQuery<SecurityScan[]>({
    queryKey: ["/api/scans"],
  });

  const recentScans = scans?.filter((s) => s.status === "completed").slice(0, 5) || [];

  const getScoreColor = (score: number | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Animated Header */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse-glow">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SecureCheck Pro
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Advanced Cybersecurity Assessment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewState.type !== "form" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewState({ type: "form" })}
                  className="border-primary/30 hover:border-primary/60"
                  data-testid="button-header-new-scan"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">New Scan</span>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Only on form view */}
      {viewState.type === "form" && (
        <div className="relative overflow-hidden border-b border-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 relative">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm animate-float">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Enterprise-Grade Security Analysis</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Comprehensive Security Assessment
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Analyze your web applications for vulnerabilities, misconfigurations, and security risks. 
                Get detailed reports with actionable recommendations.
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                {[
                  { icon: Lock, label: "SSL/TLS Analysis", desc: "Certificate validation" },
                  { icon: Shield, label: "Security Headers", desc: "HTTP protection" },
                  { icon: Globe, label: "OWASP Top 10", desc: "Vulnerability testing" },
                  { icon: Activity, label: "Real-time Scan", desc: "Live progress updates" },
                ].map((feature, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-lg border border-primary/10 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80"
                  >
                    <feature.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        {viewState.type === "form" && (
          <div className="space-y-8">
            {/* Form Section */}
            <SecurityScanForm
              onScanStarted={(scanId) => setViewState({ type: "progress", scanId })}
            />

            {/* CVE Technology Tracker Section */}
            <div className="max-w-5xl mx-auto">
              <TechnologyTracker />
            </div>

            {/* Recent Scans Section */}
            {recentScans.length > 0 && (
              <Card className="max-w-3xl mx-auto border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-primary/10">
                      <History className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Recent Assessments</CardTitle>
                  </div>
                  <CardDescription>
                    View and export previous security scan results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentScans.map((scan) => (
                      <button
                        key={scan.id}
                        onClick={() => setViewState({ type: "results", scanId: scan.id })}
                        className="w-full p-4 rounded-lg border border-primary/10 hover:border-primary/30 bg-background/50 hover:bg-background/80 text-left flex items-center justify-between gap-4 transition-all duration-200"
                        data-testid={`button-view-scan-${scan.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{scan.target}</span>
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                              {scan.configuration.scanDepth}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {scan.completedAt
                              ? format(new Date(scan.completedAt), "PPp")
                              : "In Progress"}
                            {scan.clientName && ` • ${scan.clientName}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${getScoreColor(scan.overallScore)}`}>
                            {scan.overallScore || "--"}
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {viewState.type === "progress" && (
          <ScanProgress
            scanId={viewState.scanId}
            onComplete={() => setViewState({ type: "results", scanId: viewState.scanId })}
            onCancel={() => setViewState({ type: "form" })}
          />
        )}

        {viewState.type === "results" && (
          <ScanResults
            scanId={viewState.scanId}
            onBack={() => setViewState({ type: "form" })}
          />
        )}
      </main>

      {/* Footer with Copyright */}
      <footer className="border-t border-primary/10 mt-auto bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SecureCheck Pro
              </span>
              <span>- Professional Security Assessments</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Powered by industry-standard security checks</span>
              <span className="text-primary">|</span>
              <span className="font-medium" data-testid="text-copyright">
                © 2024 Malek Berrezouga. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
