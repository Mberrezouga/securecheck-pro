import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  Copy,
  ArrowLeft,
  FileText,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { SecurityScan, SecurityFinding, ScanSummary, Severity } from "@shared/schema";
import { format } from "date-fns";

interface ScanResultsProps {
  scanId: string;
  onBack: () => void;
}

const severityIcons: Record<Severity, React.ReactNode> = {
  critical: <AlertCircle className="h-4 w-4" />,
  high: <AlertTriangle className="h-4 w-4" />,
  medium: <AlertTriangle className="h-4 w-4" />,
  low: <Info className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

const severityColors: Record<Severity, { bg: string; text: string; chart: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-500", chart: "#ef4444" },
  high: { bg: "bg-orange-500/10", text: "text-orange-500", chart: "#f97316" },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-500", chart: "#eab308" },
  low: { bg: "bg-blue-500/10", text: "text-blue-500", chart: "#3b82f6" },
  info: { bg: "bg-gray-500/10", text: "text-gray-500", chart: "#6b7280" },
};

function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { color: "text-green-500", gradient: "from-green-500 to-emerald-400" };
    if (score >= 60) return { color: "text-yellow-500", gradient: "from-yellow-500 to-amber-400" };
    if (score >= 40) return { color: "text-orange-500", gradient: "from-orange-500 to-red-400" };
    return { color: "text-red-500", gradient: "from-red-500 to-rose-600" };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Secure";
    if (score >= 60) return "Fair";
    if (score >= 40) return "At Risk";
    return "Critical";
  };

  const { color, gradient } = getScoreColor(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="stroke-muted"
            strokeWidth="8"
            fill="none"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className={`stroke-current ${color} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            r="45"
            cx="50"
            cy="50"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${color}`} data-testid="text-security-score">
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <Badge className={`mt-3 bg-gradient-to-r ${gradient} text-white border-0 px-4 py-1`}>
        {getScoreLabel(score)}
      </Badge>
    </div>
  );
}

function SeverityPieChart({ summary }: { summary: ScanSummary }) {
  const data = [
    { name: "Critical", value: summary.criticalCount, color: severityColors.critical.chart },
    { name: "High", value: summary.highCount, color: severityColors.high.chart },
    { name: "Medium", value: summary.mediumCount, color: severityColors.medium.chart },
    { name: "Low", value: summary.lowCount, color: severityColors.low.chart },
    { name: "Info", value: summary.infoCount, color: severityColors.info.chart },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No issues found</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({ findings }: { findings: SecurityFinding[] }) {
  const categoryData = findings.reduce((acc, f) => {
    const category = f.category.replace(/_/g, " ").toUpperCase();
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryData).map(([name, count]) => ({
    name: name.length > 12 ? name.substring(0, 12) + "..." : name,
    findings: count,
  }));

  if (data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
        <Bar dataKey="findings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SummaryCard({ 
  title, 
  count, 
  icon, 
  variant 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  variant: Severity;
}) {
  const colors = severityColors[variant];

  return (
    <Card className={`${colors.bg} border-0 transition-all duration-300 hover:scale-105`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-full ${colors.bg}`}>
          <span className={colors.text}>{icon}</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`} data-testid={`text-count-${variant}`}>
            {count}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FindingCard({ finding }: { finding: SecurityFinding }) {
  const { toast } = useToast();
  const colors = severityColors[finding.severity];

  const copyEvidence = () => {
    if (finding.evidence) {
      navigator.clipboard.writeText(finding.evidence);
      toast({
        title: "Copied to clipboard",
        description: "Evidence has been copied.",
      });
    }
  };

  return (
    <Card 
      className={`overflow-hidden border-l-4 transition-all duration-300 hover:shadow-lg`}
      style={{ borderLeftColor: colors.chart }}
      data-testid={`card-finding-${finding.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                className={`${colors.bg} ${colors.text} border-0 text-xs font-semibold`}
              >
                {severityIcons[finding.severity]}
                <span className="ml-1 capitalize">{finding.severity}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {finding.category.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold mt-3">{finding.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{finding.description}</p>
        </div>

        <div className="text-sm">
          <span className="font-medium">Affected Resource:</span>{" "}
          <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {finding.affectedResource}
          </code>
        </div>

        {finding.evidence && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Evidence</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyEvidence}
                data-testid={`button-copy-evidence-${finding.id}`}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap border">
              {finding.evidence}
            </pre>
          </div>
        )}

        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
          <p className="text-sm font-medium text-primary mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recommendation
          </p>
          <p className="text-sm text-foreground">{finding.recommendation}</p>
        </div>

        {finding.referenceLinks && finding.referenceLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {finding.referenceLinks.map((link, idx) => (
              <a
                key={idx}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Reference {idx + 1}
              </a>
            ))}
          </div>
        )}

        {finding.complianceTags && finding.complianceTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {finding.complianceTags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScanResults({ scanId, onBack }: ScanResultsProps) {
  const { toast } = useToast();

  const { data: scan, isLoading: scanLoading } = useQuery<SecurityScan>({
    queryKey: ["/api/scans", scanId],
  });

  const { data: findings, isLoading: findingsLoading } = useQuery<SecurityFinding[]>({
    queryKey: ["/api/scans", scanId, "findings"],
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/scans/${scanId}/export`);
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-report-${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Report exported",
        description: "Your PDF report has been downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Unable to generate PDF report.",
        variant: "destructive",
      });
    },
  });

  const isLoading = scanLoading || findingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!scan || !findings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Scan not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const summary: ScanSummary = {
    totalFindings: findings.length,
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    highCount: findings.filter((f) => f.severity === "high").length,
    mediumCount: findings.filter((f) => f.severity === "medium").length,
    lowCount: findings.filter((f) => f.severity === "low").length,
    infoCount: findings.filter((f) => f.severity === "info").length,
    overallScore: scan.overallScore || 0,
  };

  const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="border border-primary/20"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
              Security Assessment Report
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{scan.target}</code>
              <span>•</span>
              <span>{scan.completedAt ? format(new Date(scan.completedAt), "PPp") : "In Progress"}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          data-testid="button-export-pdf"
        >
          {exportMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </>
          )}
        </Button>
      </div>

      {/* Project Details */}
      {(scan.consultantName || scan.clientName || scan.projectName) && (
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {scan.consultantName && (
                <div>
                  <span className="text-muted-foreground">Consultant:</span>{" "}
                  <span className="font-medium">{scan.consultantName}</span>
                </div>
              )}
              {scan.clientName && (
                <div>
                  <span className="text-muted-foreground">Client:</span>{" "}
                  <span className="font-medium">{scan.clientName}</span>
                </div>
              )}
              {scan.projectName && (
                <div>
                  <span className="text-muted-foreground">Project:</span>{" "}
                  <span className="font-medium">{scan.projectName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Dashboard with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Gauge */}
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreGauge score={summary.overallScore} />
          </CardContent>
        </Card>

        {/* Severity Distribution Pie Chart */}
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityPieChart summary={summary} />
          </CardContent>
        </Card>

        {/* Category Bar Chart */}
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Findings by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart findings={findings} />
          </CardContent>
        </Card>
      </div>

      {/* Severity Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Critical"
          count={summary.criticalCount}
          icon={<AlertCircle className="h-5 w-5" />}
          variant="critical"
        />
        <SummaryCard
          title="High"
          count={summary.highCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="high"
        />
        <SummaryCard
          title="Medium"
          count={summary.mediumCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="medium"
        />
        <SummaryCard
          title="Low"
          count={summary.lowCount}
          icon={<Info className="h-5 w-5" />}
          variant="low"
        />
        <SummaryCard
          title="Info"
          count={summary.infoCount}
          icon={<Info className="h-5 w-5" />}
          variant="info"
        />
      </div>

      {/* Findings */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/20">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Detailed Findings</CardTitle>
          </div>
          <CardDescription>
            {summary.totalFindings} security {summary.totalFindings === 1 ? "issue" : "issues"} identified
          </CardDescription>
        </CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-lg font-medium">Excellent! No security issues found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your target passed all security checks
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 flex-wrap h-auto gap-1 bg-muted/50">
                <TabsTrigger value="all" data-testid="tab-all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  All ({summary.totalFindings})
                </TabsTrigger>
                {severityOrder.map((severity) => {
                  const count = findings.filter((f) => f.severity === severity).length;
                  if (count === 0) return null;
                  return (
                    <TabsTrigger 
                      key={severity} 
                      value={severity}
                      data-testid={`tab-${severity}`}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <span className="capitalize">{severity}</span> ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {findings
                  .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))
                  .map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
              </TabsContent>

              {severityOrder.map((severity) => (
                <TabsContent key={severity} value={severity} className="space-y-4">
                  {findings
                    .filter((f) => f.severity === severity)
                    .map((finding) => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Fixed Footer Actions */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-primary/10 -mx-4 md:-mx-6 lg:-mx-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-muted-foreground">
            Report generated on {scan.completedAt ? format(new Date(scan.completedAt), "PPpp") : "N/A"}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack} className="border-primary/20" data-testid="button-new-scan">
              <Shield className="mr-2 h-4 w-4" />
              New Scan
            </Button>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              data-testid="button-footer-export-pdf"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
