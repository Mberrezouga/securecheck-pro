import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  ShieldAlert, 
  ShieldQuestion, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import type { Technology } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import {
  SiNodedotjs,
  SiReact,
  SiPython,
  SiDjango,
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiNginx,
  SiApache,
  SiPhp,
  SiLaravel,
  SiVuedotjs,
  SiAngular,
  SiRedis,
  SiDocker,
  SiKubernetes,
  SiWordpress,
  SiRubyonrails,
  SiSpringboot,
  SiExpress,
} from "react-icons/si";
import type { IconType } from "react-icons";

const techLogos: Record<string, IconType> = {
  "Node.js": SiNodedotjs,
  "React": SiReact,
  "Python": SiPython,
  "Django": SiDjango,
  "PostgreSQL": SiPostgresql,
  "MySQL": SiMysql,
  "MongoDB": SiMongodb,
  "Nginx": SiNginx,
  "Apache HTTP Server": SiApache,
  "PHP": SiPhp,
  "Laravel": SiLaravel,
  "Vue.js": SiVuedotjs,
  "Angular": SiAngular,
  "Redis": SiRedis,
  "Docker": SiDocker,
  "Kubernetes": SiKubernetes,
  "WordPress": SiWordpress,
  "Ruby on Rails": SiRubyonrails,
  "Spring Boot": SiSpringboot,
  "Express": SiExpress,
};

const techLogoColors: Record<string, string> = {
  "Node.js": "text-green-500",
  "React": "text-cyan-400",
  "Python": "text-yellow-400",
  "Django": "text-green-600",
  "PostgreSQL": "text-blue-400",
  "MySQL": "text-orange-400",
  "MongoDB": "text-green-500",
  "Nginx": "text-green-500",
  "Apache HTTP Server": "text-red-500",
  "PHP": "text-purple-400",
  "Laravel": "text-red-400",
  "Vue.js": "text-green-400",
  "Angular": "text-red-500",
  "Redis": "text-red-500",
  "Docker": "text-blue-400",
  "Kubernetes": "text-blue-500",
  "WordPress": "text-blue-400",
  "Ruby on Rails": "text-red-500",
  "Spring Boot": "text-green-500",
  "Express": "text-gray-400",
};

const statusIcons = {
  secure: CheckCircle2,
  vulnerable: ShieldAlert,
  unknown: ShieldQuestion,
  checking: Loader2,
};

const statusColors = {
  secure: "bg-green-500/20 text-green-400 border-green-500/50",
  vulnerable: "bg-red-500/20 text-red-400 border-red-500/50",
  unknown: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  checking: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
};

const statusLabels = {
  secure: "Secure",
  vulnerable: "Vulnerable",
  unknown: "Unknown",
  checking: "Checking...",
};

const categoryColors: Record<string, string> = {
  "Runtime": "bg-purple-500/20 text-purple-400",
  "Frontend": "bg-blue-500/20 text-blue-400",
  "Backend": "bg-green-500/20 text-green-400",
  "Language": "bg-yellow-500/20 text-yellow-400",
  "Database": "bg-orange-500/20 text-orange-400",
  "Server": "bg-red-500/20 text-red-400",
  "DevOps": "bg-cyan-500/20 text-cyan-400",
  "CMS": "bg-pink-500/20 text-pink-400",
};

interface TechCubeProps {
  tech: Technology;
  onClick: () => void;
}

function TechCube({ tech, onClick }: TechCubeProps) {
  const TechLogo = techLogos[tech.name];
  const logoColor = techLogoColors[tech.name] || "text-cyan-400";
  const StatusIcon = statusIcons[tech.status as keyof typeof statusIcons] || ShieldQuestion;
  const statusColor = statusColors[tech.status as keyof typeof statusColors] || statusColors.unknown;

  return (
    <div
      onClick={onClick}
      className="glass p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col items-center gap-2 min-h-[160px]"
      data-testid={`tech-cube-${tech.id}`}
    >
      <div className={`w-12 h-12 flex items-center justify-center rounded-lg bg-black/40 ${logoColor}`}>
        {TechLogo ? <TechLogo className="w-7 h-7" /> : <Shield className="w-7 h-7 text-cyan-400" />}
      </div>
      
      <div className="text-center">
        <div className="font-semibold text-sm text-foreground truncate max-w-[120px]" data-testid={`text-cube-name-${tech.id}`}>
          {tech.name}
        </div>
      </div>

      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`} data-testid={`text-cube-status-${tech.id}`}>
        <StatusIcon className={`w-3 h-3 ${tech.status === "checking" ? "animate-spin" : ""}`} />
        <span>{statusLabels[tech.status as keyof typeof statusLabels] || "Unknown"}</span>
      </div>

      <div className="text-center text-xs">
        <div className="text-muted-foreground" data-testid={`text-cube-version-${tech.id}`}>
          v{tech.currentVersion}
        </div>
        <div className={tech.secureVersion ? "text-green-400" : "text-muted-foreground/50"} data-testid={`text-cube-secure-${tech.id}`}>
          {tech.secureVersion ? `Secure: v${tech.secureVersion}` : "Secure: N/A"}
        </div>
      </div>
    </div>
  );
}

interface TechDetailDialogProps {
  tech: Technology | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheck: (id: string) => void;
  onDelete: (id: string) => void;
  isChecking: boolean;
}

function TechDetailDialog({ tech, open, onOpenChange, onCheck, onDelete, isChecking }: TechDetailDialogProps) {
  if (!tech) return null;

  const TechLogo = techLogos[tech.name];
  const logoColor = techLogoColors[tech.name] || "text-cyan-400";
  const StatusIcon = statusIcons[tech.status as keyof typeof statusIcons] || ShieldQuestion;
  const statusColor = statusColors[tech.status as keyof typeof statusColors] || statusColors.unknown;
  const catColor = categoryColors[tech.category] || "bg-gray-500/20 text-gray-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-cyan-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg bg-black/40 ${logoColor}`}>
              {TechLogo ? <TechLogo className="w-6 h-6" /> : <Shield className="w-6 h-6 text-cyan-400" />}
            </div>
            <div>
              <span className="text-lg" data-testid={`text-detail-name-${tech.id}`}>{tech.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={catColor}>
                  {tech.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{tech.vendor}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-3 rounded-lg border border-cyan-500/10">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium ${statusColor}`} data-testid={`text-detail-status-${tech.id}`}>
                <StatusIcon className={`w-4 h-4 ${tech.status === "checking" ? "animate-spin" : ""}`} />
                <span>{statusLabels[tech.status as keyof typeof statusLabels] || "Unknown"}</span>
              </div>
            </div>

            <div className="glass p-3 rounded-lg border border-cyan-500/10">
              <div className="text-xs text-muted-foreground mb-1">Current Version</div>
              <div className="font-mono text-sm" data-testid={`text-detail-version-${tech.id}`}>v{tech.currentVersion}</div>
            </div>
          </div>

          <div className="glass p-3 rounded-lg border border-cyan-500/10">
            <div className="text-xs text-muted-foreground mb-1">Secure Version</div>
            <div className={`font-mono text-sm ${tech.secureVersion ? "text-green-400" : "text-muted-foreground"}`} data-testid={`text-detail-secure-version-${tech.id}`}>
              {tech.secureVersion ? `v${tech.secureVersion}` : "Not determined"}
            </div>
          </div>

          <div className="glass p-4 rounded-lg border border-cyan-500/10">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              CVE Impact Summary
            </div>
            
            {tech.vulnerabilityCount > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total CVEs Found</span>
                  <span className="font-bold text-lg" data-testid={`text-detail-cve-count-${tech.id}`}>{tech.vulnerabilityCount}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {tech.criticalCount > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                      <div className="text-xl font-bold text-red-400" data-testid={`text-detail-critical-${tech.id}`}>{tech.criticalCount}</div>
                      <div className="text-xs text-red-400/80">Critical</div>
                    </div>
                  )}
                  {tech.highCount > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 text-center">
                      <div className="text-xl font-bold text-orange-400" data-testid={`text-detail-high-${tech.id}`}>{tech.highCount}</div>
                      <div className="text-xs text-orange-400/80">High</div>
                    </div>
                  )}
                </div>

                {tech.criticalCount === 0 && tech.highCount === 0 && (
                  <div className="text-sm text-muted-foreground">
                    {tech.vulnerabilityCount} low/medium severity vulnerabilities
                  </div>
                )}

                {tech.topCves && tech.topCves.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Impacting CVEs</div>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {tech.topCves.map((cve: { cveId: string; description: string; severity: string; cvssScore?: number }, idx: number) => {
                        const severityColors: Record<string, string> = {
                          CRITICAL: "bg-red-500/20 text-red-400 border-red-500/50",
                          HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/50",
                          MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
                          LOW: "bg-blue-500/20 text-blue-400 border-blue-500/50",
                          UNKNOWN: "bg-gray-500/20 text-gray-400 border-gray-500/50",
                        };
                        const color = severityColors[cve.severity] || severityColors.UNKNOWN;
                        return (
                          <div key={idx} className="bg-black/20 rounded-lg p-2 border border-cyan-500/10" data-testid={`cve-item-${cve.cveId}`}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-mono text-xs text-cyan-400">{cve.cveId}</span>
                              <div className="flex items-center gap-1">
                                {cve.cvssScore && (
                                  <span className="text-xs font-medium">{cve.cvssScore.toFixed(1)}</span>
                                )}
                                <Badge variant="outline" className={`text-xs px-1.5 py-0 ${color}`}>
                                  {cve.severity}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{cve.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-sm text-green-400">No CVEs found</div>
              </div>
            )}
          </div>

          {tech.lastCheckedAt && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last checked: {format(new Date(tech.lastCheckedAt), "MMM d, yyyy 'at' HH:mm")}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onCheck(tech.id)}
              disabled={isChecking || tech.status === "checking"}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              data-testid={`button-detail-check-${tech.id}`}
            >
              {tech.status === "checking" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check CVEs
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                onDelete(tech.id);
                onOpenChange(false);
              }}
              data-testid={`button-detail-delete-${tech.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TechnologyTracker() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newTech, setNewTech] = useState({
    name: "",
    vendor: "",
    category: "Backend",
    currentVersion: "",
  });

  const { data: technologies, isLoading } = useQuery<Technology[]>({
    queryKey: ["/api/technologies"],
    refetchInterval: 5000,
  });

  const checkAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/technologies/check");
    },
    onSuccess: () => {
      toast({
        title: "CVE Check Started",
        description: "Checking all technologies for vulnerabilities. This may take a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/technologies"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start CVE check",
        variant: "destructive",
      });
    },
  });

  const addTechMutation = useMutation({
    mutationFn: async (tech: typeof newTech) => {
      return apiRequest("POST", "/api/technologies", {
        ...tech,
        status: "unknown",
        vulnerabilityCount: 0,
        criticalCount: 0,
        highCount: 0,
      });
    },
    onSuccess: () => {
      toast({ title: "Technology Added", description: "New technology added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/technologies"] });
      setIsAddDialogOpen(false);
      setNewTech({ name: "", vendor: "", category: "Backend", currentVersion: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add technology", variant: "destructive" });
    },
  });

  const deleteTechMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/technologies/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Technology removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/technologies"] });
    },
  });

  const checkSingleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/technologies/${id}/check`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technologies"] });
    },
  });

  const sortedTechnologies = useMemo(() => {
    if (!technologies) return [];
    return [...technologies].sort((a, b) => a.name.localeCompare(b.name));
  }, [technologies]);

  const secureCount = technologies?.filter(t => t.status === "secure").length || 0;
  const vulnerableCount = technologies?.filter(t => t.status === "vulnerable").length || 0;
  const totalCritical = technologies?.reduce((sum, t) => sum + (t.criticalCount || 0), 0) || 0;
  const totalHigh = technologies?.reduce((sum, t) => sum + (t.highCount || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card className="glass border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Shield className="w-5 h-5" />
            CVE Technology Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass border-cyan-500/20">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-cyan-400 neon-text">
              <Shield className="w-5 h-5" />
              CVE Technology Tracker
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Click on any technology to view CVE details
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-add-technology">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle>Add Technology</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newTech.name}
                      onChange={(e) => setNewTech({ ...newTech, name: e.target.value })}
                      placeholder="e.g., React"
                      data-testid="input-tech-name"
                    />
                  </div>
                  <div>
                    <Label>Vendor</Label>
                    <Input
                      value={newTech.vendor}
                      onChange={(e) => setNewTech({ ...newTech, vendor: e.target.value })}
                      placeholder="e.g., facebook"
                      data-testid="input-tech-vendor"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newTech.category}
                      onValueChange={(val) => setNewTech({ ...newTech, category: val })}
                    >
                      <SelectTrigger data-testid="select-tech-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Frontend">Frontend</SelectItem>
                        <SelectItem value="Backend">Backend</SelectItem>
                        <SelectItem value="Database">Database</SelectItem>
                        <SelectItem value="Runtime">Runtime</SelectItem>
                        <SelectItem value="Language">Language</SelectItem>
                        <SelectItem value="Server">Server</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="CMS">CMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Current Version</Label>
                    <Input
                      value={newTech.currentVersion}
                      onChange={(e) => setNewTech({ ...newTech, currentVersion: e.target.value })}
                      placeholder="e.g., 18.2.0"
                      data-testid="input-tech-version"
                    />
                  </div>
                  <Button 
                    onClick={() => addTechMutation.mutate(newTech)}
                    disabled={addTechMutation.isPending || !newTech.name || !newTech.vendor || !newTech.currentVersion}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                    data-testid="button-submit-technology"
                  >
                    {addTechMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Technology
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => checkAllMutation.mutate()}
              disabled={checkAllMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-check-all-cves"
            >
              {checkAllMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check All CVEs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass p-4 rounded-lg border border-green-500/30 text-center">
              <div className="text-2xl font-bold text-green-400" data-testid="text-secure-count">{secureCount}</div>
              <div className="text-xs text-muted-foreground">Secure</div>
            </div>
            <div className="glass p-4 rounded-lg border border-red-500/30 text-center">
              <div className="text-2xl font-bold text-red-400" data-testid="text-vulnerable-count">{vulnerableCount}</div>
              <div className="text-xs text-muted-foreground">Vulnerable</div>
            </div>
            <div className="glass p-4 rounded-lg border border-red-600/30 text-center">
              <div className="text-2xl font-bold text-red-500" data-testid="text-critical-cves">{totalCritical}</div>
              <div className="text-xs text-muted-foreground">Critical CVEs</div>
            </div>
            <div className="glass p-4 rounded-lg border border-orange-500/30 text-center">
              <div className="text-2xl font-bold text-orange-400" data-testid="text-high-cves">{totalHigh}</div>
              <div className="text-xs text-muted-foreground">High CVEs</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {sortedTechnologies.map((tech) => (
              <TechCube
                key={tech.id}
                tech={tech}
                onClick={() => {
                  setSelectedTech(tech);
                  setIsDetailOpen(true);
                }}
              />
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-xs text-muted-foreground text-center">
              Data sourced from NIST National Vulnerability Database (NVD). Automatic checks run weekly.
            </p>
          </div>
        </CardContent>
      </Card>

      <TechDetailDialog
        tech={selectedTech}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onCheck={(id) => checkSingleMutation.mutate(id)}
        onDelete={(id) => deleteTechMutation.mutate(id)}
        isChecking={checkSingleMutation.isPending}
      />
    </>
  );
}
