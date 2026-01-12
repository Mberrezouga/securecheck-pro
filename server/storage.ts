import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  technologies,
  type Technology,
  type InsertTechnology,
} from "@shared/schema";
import type { 
  SecurityScan, 
  InsertSecurityScan, 
  SecurityFinding, 
  InsertSecurityFinding,
} from "@shared/schema";

export interface IStorage {
  // Scans (in-memory)
  createScan(scan: InsertSecurityScan): Promise<SecurityScan>;
  getScan(id: string): Promise<SecurityScan | undefined>;
  getAllScans(): Promise<SecurityScan[]>;
  updateScan(id: string, updates: Partial<SecurityScan>): Promise<SecurityScan | undefined>;
  
  // Findings (in-memory)
  createFinding(finding: InsertSecurityFinding): Promise<SecurityFinding>;
  getFindings(scanId: string): Promise<SecurityFinding[]>;
  
  // Technologies (database)
  getAllTechnologies(): Promise<Technology[]>;
  getTechnology(id: string): Promise<Technology | undefined>;
  createTechnology(tech: InsertTechnology): Promise<Technology>;
  updateTechnology(id: string, updates: Partial<Technology>): Promise<Technology | undefined>;
  deleteTechnology(id: string): Promise<boolean>;
  seedTechnologies(): Promise<void>;
}

// Default technologies to seed
const defaultTechnologies: InsertTechnology[] = [
  { name: "Node.js", vendor: "nodejs", category: "Runtime", cpe: "cpe:2.3:a:nodejs:node.js", currentVersion: "20.10.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "React", vendor: "facebook", category: "Frontend", cpe: "cpe:2.3:a:facebook:react", currentVersion: "18.2.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Express", vendor: "expressjs", category: "Backend", cpe: "cpe:2.3:a:expressjs:express", currentVersion: "4.18.2", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Python", vendor: "python", category: "Language", cpe: "cpe:2.3:a:python:python", currentVersion: "3.12.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Django", vendor: "djangoproject", category: "Backend", cpe: "cpe:2.3:a:djangoproject:django", currentVersion: "5.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "PostgreSQL", vendor: "postgresql", category: "Database", cpe: "cpe:2.3:a:postgresql:postgresql", currentVersion: "16.1", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "MySQL", vendor: "oracle", category: "Database", cpe: "cpe:2.3:a:oracle:mysql", currentVersion: "8.2.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "MongoDB", vendor: "mongodb", category: "Database", cpe: "cpe:2.3:a:mongodb:mongodb", currentVersion: "7.0.4", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Nginx", vendor: "nginx", category: "Server", cpe: "cpe:2.3:a:nginx:nginx", currentVersion: "1.25.3", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Apache HTTP Server", vendor: "apache", category: "Server", cpe: "cpe:2.3:a:apache:http_server", currentVersion: "2.4.58", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "PHP", vendor: "php", category: "Language", cpe: "cpe:2.3:a:php:php", currentVersion: "8.3.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Laravel", vendor: "laravel", category: "Backend", cpe: "cpe:2.3:a:laravel:laravel", currentVersion: "10.35.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Vue.js", vendor: "vuejs", category: "Frontend", cpe: "cpe:2.3:a:vuejs:vue", currentVersion: "3.4.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Angular", vendor: "google", category: "Frontend", cpe: "cpe:2.3:a:google:angular", currentVersion: "17.0.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Redis", vendor: "redis", category: "Database", cpe: "cpe:2.3:a:redis:redis", currentVersion: "7.2.3", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Docker", vendor: "docker", category: "DevOps", cpe: "cpe:2.3:a:docker:docker", currentVersion: "24.0.7", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Kubernetes", vendor: "kubernetes", category: "DevOps", cpe: "cpe:2.3:a:kubernetes:kubernetes", currentVersion: "1.29.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "WordPress", vendor: "wordpress", category: "CMS", cpe: "cpe:2.3:a:wordpress:wordpress", currentVersion: "6.4.2", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Spring Boot", vendor: "vmware", category: "Backend", cpe: "cpe:2.3:a:vmware:spring_boot", currentVersion: "3.2.0", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
  { name: "Ruby on Rails", vendor: "rubyonrails", category: "Backend", cpe: "cpe:2.3:a:rubyonrails:rails", currentVersion: "7.1.2", status: "unknown", vulnerabilityCount: 0, criticalCount: 0, highCount: 0 },
];

export class DatabaseStorage implements IStorage {
  private scans: Map<string, SecurityScan>;
  private findings: Map<string, SecurityFinding[]>;

  constructor() {
    this.scans = new Map();
    this.findings = new Map();
  }

  // Scans (in-memory)
  async createScan(insertScan: InsertSecurityScan): Promise<SecurityScan> {
    const id = randomUUID();
    const scan: SecurityScan = {
      id,
      target: insertScan.target,
      status: "pending",
      configuration: insertScan.configuration,
      initiatedAt: new Date().toISOString(),
      consultantName: insertScan.consultantName,
      clientName: insertScan.clientName,
      projectName: insertScan.projectName,
    };
    this.scans.set(id, scan);
    this.findings.set(id, []);
    return scan;
  }

  async getScan(id: string): Promise<SecurityScan | undefined> {
    return this.scans.get(id);
  }

  async getAllScans(): Promise<SecurityScan[]> {
    return Array.from(this.scans.values()).sort(
      (a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()
    );
  }

  async updateScan(id: string, updates: Partial<SecurityScan>): Promise<SecurityScan | undefined> {
    const scan = this.scans.get(id);
    if (!scan) return undefined;
    
    const updatedScan = { ...scan, ...updates };
    this.scans.set(id, updatedScan);
    return updatedScan;
  }

  async createFinding(finding: InsertSecurityFinding): Promise<SecurityFinding> {
    const id = randomUUID();
    const newFinding: SecurityFinding = { ...finding, id };
    
    const scanFindings = this.findings.get(finding.scanId) || [];
    scanFindings.push(newFinding);
    this.findings.set(finding.scanId, scanFindings);
    
    return newFinding;
  }

  async getFindings(scanId: string): Promise<SecurityFinding[]> {
    return this.findings.get(scanId) || [];
  }

  // Technologies (database)
  async getAllTechnologies(): Promise<Technology[]> {
    return await db.select().from(technologies);
  }

  async getTechnology(id: string): Promise<Technology | undefined> {
    const [tech] = await db.select().from(technologies).where(eq(technologies.id, id));
    return tech || undefined;
  }

  async createTechnology(tech: InsertTechnology): Promise<Technology> {
    const [newTech] = await db.insert(technologies).values(tech).returning();
    return newTech;
  }

  async updateTechnology(id: string, updates: Partial<Technology>): Promise<Technology | undefined> {
    const [updated] = await db
      .update(technologies)
      .set(updates)
      .where(eq(technologies.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTechnology(id: string): Promise<boolean> {
    const result = await db.delete(technologies).where(eq(technologies.id, id));
    return true;
  }

  async seedTechnologies(): Promise<void> {
    const existing = await this.getAllTechnologies();
    if (existing.length === 0) {
      for (const tech of defaultTechnologies) {
        await this.createTechnology(tech);
      }
      console.log(`Seeded ${defaultTechnologies.length} default technologies`);
    }
  }
}

export const storage = new DatabaseStorage();
