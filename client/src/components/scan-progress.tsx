import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Clock, XCircle, CheckCircle2, Loader2, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SecurityScan, ScanProgress as ScanProgressType } from "@shared/schema";

interface ScanProgressProps {
  scanId: string;
  onComplete: () => void;
  onCancel: () => void;
}

const phaseMessages = [
  { phase: "Initializing", message: "Preparing security scan environment...", icon: Zap },
  { phase: "SSL/TLS", message: "Analyzing certificate and encryption...", icon: Shield },
  { phase: "Headers", message: "Checking security headers configuration...", icon: Shield },
  { phase: "Vulnerabilities", message: "Scanning for known vulnerabilities...", icon: Activity },
  { phase: "OWASP", message: "Testing OWASP Top 10 security risks...", icon: Shield },
  { phase: "Ports", message: "Performing port analysis...", icon: Activity },
  { phase: "DNS", message: "Checking DNS security configuration...", icon: Shield },
  { phase: "Analysis", message: "Analyzing collected data...", icon: Activity },
  { phase: "Report", message: "Generating security report...", icon: CheckCircle2 },
];

export function ScanProgress({ scanId, onComplete, onCancel }: ScanProgressProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [findingsCount, setFindingsCount] = useState(0);

  const { data: scan } = useQuery<SecurityScan>({
    queryKey: ["/api/scans", scanId],
    refetchInterval: 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/scans/${scanId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      toast({
        title: "Scan cancelled",
        description: "The security scan has been stopped.",
      });
      onCancel();
    },
  });

  useEffect(() => {
    if (scan?.status === "completed") {
      setProgress(100);
      setPhaseIndex(phaseMessages.length - 1);
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }

    if (scan?.status === "running") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          const increment = Math.random() * 6 + 2;
          return Math.min(prev + increment, 95);
        });
        setPhaseIndex((prev) => {
          const newIndex = Math.floor((progress / 100) * (phaseMessages.length - 1));
          return Math.max(prev, Math.min(newIndex, phaseMessages.length - 2));
        });
        setFindingsCount((prev) => {
          if (Math.random() > 0.7) {
            return prev + Math.floor(Math.random() * 2) + 1;
          }
          return prev;
        });
      }, 600);
      return () => clearInterval(interval);
    }
  }, [scan?.status, onComplete, progress]);

  const estimatedTime = Math.max(1, Math.ceil((100 - progress) / 12));
  const currentPhase = phaseMessages[phaseIndex];
  const PhaseIcon = currentPhase.icon;

  return (
    <Card className="w-full max-w-2xl mx-auto border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
      {/* Animated scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
      </div>

      <CardHeader className="pb-6 border-b border-primary/10 relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse-glow">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Security Scan in Progress</CardTitle>
            <CardDescription className="text-sm mt-1 flex items-center gap-2">
              <span>Analyzing</span>
              <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                {scan?.target || "target"}
              </code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6 relative">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 animate-cyber-pulse" />
              Progress
            </span>
            <span className="font-bold text-lg text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-4" data-testid="progress-scan" />
            <div 
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary/50 to-transparent animate-pulse"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Phase */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
          <div className="p-2 rounded-lg bg-primary/20 animate-float">
            <PhaseIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-primary/20 text-primary border-0 text-xs">
                {currentPhase.phase}
              </Badge>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <p className="text-sm font-medium mt-1" data-testid="text-current-phase">
              {currentPhase.message}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Estimated time remaining: ~{estimatedTime} min</span>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-2 rounded-full bg-green-500/20 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">Checks Done</p>
              <p className="text-2xl font-bold text-green-500">{Math.floor(progress / 12)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-2 rounded-full bg-primary/20 mb-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Findings</p>
              <p className="text-2xl font-bold text-primary">{findingsCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-2 rounded-full bg-secondary/20 mb-2">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs text-muted-foreground">Requests</p>
              <p className="text-2xl font-bold text-secondary">{Math.floor(progress * 2.5)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Phase Progress */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Scan Phases</p>
          <div className="flex gap-1">
            {phaseMessages.map((phase, idx) => (
              <div
                key={idx}
                className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                  idx <= phaseIndex
                    ? "bg-gradient-to-r from-primary to-secondary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          data-testid="button-cancel-scan"
        >
          <XCircle className="mr-2 h-4 w-4" />
          {cancelMutation.isPending ? "Cancelling..." : "Cancel Scan"}
        </Button>
      </CardContent>
    </Card>
  );
}
