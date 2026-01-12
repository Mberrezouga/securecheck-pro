import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, Search, Globe, Lock, AlertTriangle, Network, Server, Settings2, 
  ChevronDown, ChevronUp, Clock, CheckCircle2, Info, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSecurityScanSchema, type InsertSecurityScan, type CheckType, checkTypeInfo } from "@shared/schema";

const checkTypeIcons: Record<CheckType, React.ReactNode> = {
  ssl_tls: <Lock className="h-5 w-5" />,
  security_headers: <Shield className="h-5 w-5" />,
  vulnerability_scan: <AlertTriangle className="h-5 w-5" />,
  owasp_top_10: <Globe className="h-5 w-5" />,
  port_scan: <Network className="h-5 w-5" />,
  dns_security: <Server className="h-5 w-5" />,
};

interface SecurityScanFormProps {
  onScanStarted: (scanId: string) => void;
}

function CheckTypeCard({ 
  type, 
  isSelected, 
  onToggle 
}: { 
  type: CheckType; 
  isSelected: boolean; 
  onToggle: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const info = checkTypeInfo[type];

  return (
    <div
      className={`rounded-lg border-2 transition-all duration-300 ${
        isSelected 
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
          : "border-border hover:border-primary/30 bg-card/50"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className={`p-2 rounded-lg transition-colors ${
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {checkTypeIcons[type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggle}
                  data-testid={`checkbox-${type}`}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label className="text-sm font-semibold cursor-pointer" onClick={onToggle}>
                  {info.label}
                </Label>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                <Clock className="h-3 w-3 mr-1" />
                {info.estimatedTime}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          data-testid={`button-expand-${type}`}
        >
          <Info className="h-3 w-3 mr-1" />
          {isExpanded ? "Hide Details" : "Learn More"}
          {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">{info.detailedInfo}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                What We Check:
              </p>
              <ul className="grid grid-cols-1 gap-1">
                {info.whatWeCheck.map((item, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3" />
                Why It Matters:
              </p>
              <p className="text-xs text-muted-foreground">{info.whyItMatters}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SecurityScanForm({ onScanStarted }: SecurityScanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSecurityScan>({
    resolver: zodResolver(insertSecurityScanSchema),
    defaultValues: {
      target: "",
      consultantName: "",
      clientName: "",
      projectName: "",
      configuration: {
        checkTypes: ["ssl_tls", "security_headers"],
        scanDepth: "standard",
        notes: "",
      },
    },
  });

  const startScanMutation = useMutation({
    mutationFn: async (data: InsertSecurityScan) => {
      const response = await apiRequest("POST", "/api/scans", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      toast({
        title: "Security scan started",
        description: "Your security assessment is now running.",
      });
      onScanStarted(data.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start scan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSecurityScan) => {
    startScanMutation.mutate(data);
  };

  const checkTypes: CheckType[] = ["ssl_tls", "security_headers", "vulnerability_scan", "owasp_top_10", "port_scan", "dns_security"];
  const selectedCheckTypes = form.watch("configuration.checkTypes");

  return (
    <Card className="w-full max-w-4xl mx-auto border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
      <CardHeader className="pb-6 border-b border-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse-glow">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
              New Security Assessment
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Configure and run a comprehensive security check on your target
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Project Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="p-1 rounded bg-secondary/20">
                  <Settings2 className="h-4 w-4 text-secondary" />
                </div>
                <span>Project Details</span>
                <Badge variant="outline" className="text-xs">Optional</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="consultantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Consultant Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          className="border-primary/20 focus:border-primary"
                          {...field}
                          data-testid="input-consultant-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Client Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Client organization"
                          className="border-primary/20 focus:border-primary"
                          {...field}
                          data-testid="input-client-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Project Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Assessment project"
                          className="border-primary/20 focus:border-primary"
                          {...field}
                          data-testid="input-project-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Target URL Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="p-1 rounded bg-primary/20">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <span>Target</span>
                <Badge variant="default" className="text-xs">Required</Badge>
              </div>
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Target URL or Domain</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="https://example.com or example.com"
                          className="pl-11 h-12 text-lg border-primary/20 focus:border-primary"
                          {...field}
                          data-testid="input-target-url"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter the full URL or domain name you want to scan. We'll automatically detect protocols and configurations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Check Types Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1 rounded bg-primary/20">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span>Security Checks</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedCheckTypes.length} selected
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the security checks you want to perform. Click "Learn More" on each check to understand what it analyzes and why it's important.
              </p>
              <FormField
                control={form.control}
                name="configuration.checkTypes"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {checkTypes.map((type) => (
                        <CheckTypeCard
                          key={type}
                          type={type}
                          isSelected={field.value?.includes(type)}
                          onToggle={() => {
                            if (field.value?.includes(type)) {
                              field.onChange(field.value.filter((v) => v !== type));
                            } else {
                              field.onChange([...field.value, type]);
                            }
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Scan Depth Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="p-1 rounded bg-secondary/20">
                  <Zap className="h-4 w-4 text-secondary" />
                </div>
                <span>Scan Depth</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose how thorough the scan should be. Deeper scans take longer but find more issues.
              </p>
              <FormField
                control={form.control}
                name="configuration.scanDepth"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-4"
                        data-testid="radio-scan-depth"
                      >
                        {[
                          { value: "quick", label: "Quick", time: "~2 min", desc: "Fast overview of critical issues" },
                          { value: "standard", label: "Standard", time: "~5 min", desc: "Balanced depth and speed" },
                          { value: "deep", label: "Deep", time: "~15 min", desc: "Comprehensive analysis" },
                        ].map((option) => (
                          <div key={option.value}>
                            <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                            <Label
                              htmlFor={option.value}
                              className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 ${
                                field.value === option.value
                                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                  : "border-border hover:border-primary/30 bg-card/50"
                              }`}
                            >
                              <span className="text-lg font-bold">{option.label}</span>
                              <span className="text-xs text-primary font-medium mt-1">{option.time}</span>
                              <span className="text-xs text-muted-foreground mt-2 text-center">{option.desc}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="configuration.notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific areas of concern or additional context for this assessment..."
                      className="min-h-24 resize-none border-primary/20 focus:border-primary"
                      {...field}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20 transition-all duration-300"
              disabled={startScanMutation.isPending}
              data-testid="button-start-scan"
            >
              {startScanMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent mr-3" />
                  Initializing Scan...
                </>
              ) : (
                <>
                  <Shield className="mr-3 h-6 w-6" />
                  Run Security Assessment
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
