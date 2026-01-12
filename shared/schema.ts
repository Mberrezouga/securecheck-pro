import { z } from "zod";
import { pgTable, text, integer, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// CVE record schema (defined first for use in Technology)
export const cveRecordSchema = z.object({
  cveId: z.string(),
  description: z.string(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
  cvssScore: z.number().optional(),
  publishedDate: z.string(),
  affectedVersions: z.array(z.string()).optional(),
});
export type CveRecord = z.infer<typeof cveRecordSchema>;

// Technology status enum
export const technologyStatusEnum = z.enum(["secure", "vulnerable", "unknown", "checking"]);
export type TechnologyStatus = z.infer<typeof technologyStatusEnum>;

// Technology table for CVE tracking (Drizzle ORM)
export const technologies = pgTable("technologies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  vendor: text("vendor").notNull(),
  category: text("category").notNull(),
  cpe: text("cpe"),
  currentVersion: text("current_version").notNull(),
  latestVersion: text("latest_version"),
  secureVersion: text("secure_version"),
  status: text("status").notNull().default("unknown"),
  vulnerabilityCount: integer("vulnerability_count").notNull().default(0),
  criticalCount: integer("critical_count").notNull().default(0),
  highCount: integer("high_count").notNull().default(0),
  topCves: jsonb("top_cves").$type<CveRecord[]>(),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTechnologySchema = createInsertSchema(technologies).omit({ 
  id: true, 
  createdAt: true,
  lastCheckedAt: true 
});
export type InsertTechnology = z.infer<typeof insertTechnologySchema>;
export type Technology = typeof technologies.$inferSelect;

// Severity levels for security findings
export const severityEnum = z.enum(["critical", "high", "medium", "low", "info"]);
export type Severity = z.infer<typeof severityEnum>;

// Scan status
export const scanStatusEnum = z.enum(["pending", "running", "completed", "cancelled", "failed"]);
export type ScanStatus = z.infer<typeof scanStatusEnum>;

// Scan check types
export const checkTypeEnum = z.enum([
  "ssl_tls",
  "security_headers",
  "vulnerability_scan",
  "owasp_top_10",
  "port_scan",
  "dns_security"
]);
export type CheckType = z.infer<typeof checkTypeEnum>;

// Security finding schema
export const securityFindingSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  category: checkTypeEnum,
  severity: severityEnum,
  title: z.string(),
  description: z.string(),
  evidence: z.string().optional(),
  recommendation: z.string(),
  affectedResource: z.string(),
  referenceLinks: z.array(z.string()).optional(),
  complianceTags: z.array(z.string()).optional(),
});

export type SecurityFinding = z.infer<typeof securityFindingSchema>;
export type InsertSecurityFinding = Omit<SecurityFinding, "id">;

// Scan configuration schema
export const scanConfigSchema = z.object({
  checkTypes: z.array(checkTypeEnum).min(1, "Select at least one check type"),
  scanDepth: z.enum(["quick", "standard", "deep"]),
  notes: z.string().optional(),
});

export type ScanConfig = z.infer<typeof scanConfigSchema>;

// Security scan request schema
export const securityScanSchema = z.object({
  id: z.string(),
  target: z.string().min(1, "Target is required"),
  status: scanStatusEnum,
  configuration: scanConfigSchema,
  initiatedAt: z.string(),
  completedAt: z.string().optional(),
  overallScore: z.number().min(0).max(100).optional(),
  consultantName: z.string().optional(),
  clientName: z.string().optional(),
  projectName: z.string().optional(),
});

export type SecurityScan = z.infer<typeof securityScanSchema>;

// Insert schema for creating new scans
export const insertSecurityScanSchema = z.object({
  target: z.string().url("Please enter a valid URL").or(z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/, "Please enter a valid domain")),
  configuration: scanConfigSchema,
  consultantName: z.string().optional(),
  clientName: z.string().optional(),
  projectName: z.string().optional(),
});

export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;

// Summary stats for dashboard
export interface ScanSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  overallScore: number;
}

// Scan progress for live updates
export interface ScanProgress {
  scanId: string;
  currentPhase: string;
  percentComplete: number;
  estimatedTimeRemaining: number;
}

// Enhanced check type display info with detailed explanations
export const checkTypeInfo: Record<CheckType, { 
  label: string; 
  description: string;
  detailedInfo: string;
  whatWeCheck: string[];
  whyItMatters: string;
  estimatedTime: string;
}> = {
  ssl_tls: { 
    label: "SSL/TLS Analysis", 
    description: "Certificate validation, protocol versions, cipher strength",
    detailedInfo: "Comprehensive analysis of your SSL/TLS configuration to ensure encrypted communications are properly secured.",
    whatWeCheck: [
      "Certificate validity and expiration",
      "TLS protocol versions (1.0, 1.1, 1.2, 1.3)",
      "Cipher suite strength and configuration",
      "Certificate chain validation",
      "OCSP stapling configuration",
      "Perfect forward secrecy support"
    ],
    whyItMatters: "Weak SSL/TLS configurations can allow attackers to intercept encrypted communications, steal sensitive data, or perform man-in-the-middle attacks.",
    estimatedTime: "~30 seconds"
  },
  security_headers: { 
    label: "Security Headers", 
    description: "HTTP security headers analysis",
    detailedInfo: "Examines HTTP response headers that provide additional security layers against common web attacks.",
    whatWeCheck: [
      "Content-Security-Policy (CSP)",
      "X-Frame-Options (clickjacking protection)",
      "X-Content-Type-Options",
      "Strict-Transport-Security (HSTS)",
      "Referrer-Policy",
      "Permissions-Policy"
    ],
    whyItMatters: "Security headers are your first line of defense against XSS, clickjacking, and data injection attacks. Missing headers leave your application vulnerable.",
    estimatedTime: "~15 seconds"
  },
  vulnerability_scan: { 
    label: "Vulnerability Scan", 
    description: "Known CVE and vulnerability detection",
    detailedInfo: "Scans for known vulnerabilities in web servers, frameworks, and exposed services using CVE databases.",
    whatWeCheck: [
      "Outdated software versions",
      "Known CVE vulnerabilities",
      "Directory listing exposure",
      "Sensitive file exposure",
      "Server information disclosure",
      "Backup file detection"
    ],
    whyItMatters: "Known vulnerabilities are actively exploited by attackers. Keeping software updated and properly configured is critical for security.",
    estimatedTime: "~2 minutes"
  },
  owasp_top_10: { 
    label: "OWASP Top 10", 
    description: "Common web application security risks",
    detailedInfo: "Tests for the most critical web application security risks as defined by OWASP (Open Web Application Security Project).",
    whatWeCheck: [
      "SQL Injection vulnerabilities",
      "Cross-Site Scripting (XSS)",
      "Broken Authentication",
      "Insecure Direct Object References",
      "Security Misconfiguration",
      "Sensitive Data Exposure"
    ],
    whyItMatters: "OWASP Top 10 represents the most dangerous security risks. These vulnerabilities account for the majority of web application breaches.",
    estimatedTime: "~3 minutes"
  },
  port_scan: { 
    label: "Port Scan", 
    description: "Open ports and service detection",
    detailedInfo: "Identifies open network ports and running services to assess the attack surface of your target.",
    whatWeCheck: [
      "Common service ports (HTTP, HTTPS, SSH, FTP)",
      "Database ports (MySQL, PostgreSQL, MongoDB)",
      "Administrative interfaces",
      "Unnecessary exposed services",
      "Service version detection",
      "Firewall configuration gaps"
    ],
    whyItMatters: "Every open port is a potential entry point for attackers. Minimizing exposed services reduces your attack surface significantly.",
    estimatedTime: "~1 minute"
  },
  dns_security: { 
    label: "DNS Security", 
    description: "DNS configuration and security analysis",
    detailedInfo: "Analyzes DNS records and configuration to ensure proper email security and prevent DNS-based attacks.",
    whatWeCheck: [
      "DNSSEC configuration",
      "SPF records for email authentication",
      "DKIM signatures",
      "DMARC policy configuration",
      "CAA records",
      "Zone transfer restrictions"
    ],
    whyItMatters: "DNS vulnerabilities can lead to email spoofing, phishing attacks, and domain hijacking. Proper DNS security protects your brand and users.",
    estimatedTime: "~20 seconds"
  },
};

// Severity display info
export const severityInfo: Record<Severity, { label: string; color: string; bgColor: string }> = {
  critical: { label: "Critical", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  high: { label: "High", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  medium: { label: "Medium", color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  low: { label: "Low", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  info: { label: "Info", color: "text-gray-700 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800/30" },
};
