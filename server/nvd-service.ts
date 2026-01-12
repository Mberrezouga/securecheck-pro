import type { Technology, CveRecord } from "@shared/schema";

const NVD_API_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const RATE_LIMIT_DELAY = 6500; // 6.5 seconds between requests (NVD recommends 6 sec without API key)

// Rate limiting queue
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

interface NvdCveItem {
  cve: {
    id: string;
    descriptions: Array<{ lang: string; value: string }>;
    published: string;
    metrics?: {
      cvssMetricV31?: Array<{
        cvssData: {
          baseScore: number;
          baseSeverity: string;
        };
      }>;
      cvssMetricV2?: Array<{
        cvssData: {
          baseScore: number;
        };
        baseSeverity?: string;
      }>;
    };
    configurations?: Array<{
      nodes?: Array<{
        cpeMatch?: Array<{
          criteria: string;
          versionEndIncluding?: string;
          versionEndExcluding?: string;
          versionStartIncluding?: string;
        }>;
      }>;
    }>;
  };
}

interface NvdResponse {
  totalResults: number;
  vulnerabilities: NvdCveItem[];
}

function getSeverity(item: NvdCveItem): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" {
  const v31 = item.cve.metrics?.cvssMetricV31?.[0];
  if (v31) {
    const severity = v31.cvssData.baseSeverity.toUpperCase();
    if (severity === "CRITICAL" || severity === "HIGH" || severity === "MEDIUM" || severity === "LOW") {
      return severity;
    }
  }
  
  const v2 = item.cve.metrics?.cvssMetricV2?.[0];
  if (v2?.baseSeverity) {
    const severity = v2.baseSeverity.toUpperCase();
    if (severity === "HIGH" || severity === "MEDIUM" || severity === "LOW") {
      return severity;
    }
  }
  
  return "UNKNOWN";
}

function getCvssScore(item: NvdCveItem): number | undefined {
  const v31 = item.cve.metrics?.cvssMetricV31?.[0];
  if (v31) return v31.cvssData.baseScore;
  
  const v2 = item.cve.metrics?.cvssMetricV2?.[0];
  if (v2) return v2.cvssData.baseScore;
  
  return undefined;
}

export async function fetchCvesForTechnology(tech: Technology): Promise<{
  cves: CveRecord[];
  topCves: CveRecord[];
  totalCount: number;
  criticalCount: number;
  highCount: number;
}> {
  try {
    // Build CPE query - search by keyword (vendor + product name)
    const searchTerm = `${tech.vendor} ${tech.name}`.toLowerCase();
    const url = `${NVD_API_BASE}?keywordSearch=${encodeURIComponent(searchTerm)}&resultsPerPage=100`;
    
    console.log(`Fetching CVEs for ${tech.name} from NVD...`);
    
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`Rate limited by NVD API for ${tech.name}`);
        return { cves: [], topCves: [], totalCount: 0, criticalCount: 0, highCount: 0 };
      }
      throw new Error(`NVD API error: ${response.status}`);
    }
    
    const data: NvdResponse = await response.json();
    
    const cves: CveRecord[] = data.vulnerabilities.map(item => ({
      cveId: item.cve.id,
      description: item.cve.descriptions.find(d => d.lang === "en")?.value || "No description available",
      severity: getSeverity(item),
      cvssScore: getCvssScore(item),
      publishedDate: item.cve.published,
    }));
    
    const criticalCount = cves.filter(c => c.severity === "CRITICAL").length;
    const highCount = cves.filter(c => c.severity === "HIGH").length;
    
    // Get top 5 most severe CVEs (critical first, then high, sorted by CVSS score)
    const topCves = [...cves]
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return (b.cvssScore || 0) - (a.cvssScore || 0);
      })
      .slice(0, 5);
    
    console.log(`Found ${data.totalResults} CVEs for ${tech.name} (${criticalCount} critical, ${highCount} high)`);
    
    return {
      cves,
      topCves,
      totalCount: data.totalResults,
      criticalCount,
      highCount,
    };
  } catch (error) {
    console.error(`Error fetching CVEs for ${tech.name}:`, error);
    return { cves: [], topCves: [], totalCount: 0, criticalCount: 0, highCount: 0 };
  }
}

export function determineSecurityStatus(
  totalVulnerabilities: number,
  criticalCount: number,
  highCount: number
): "secure" | "vulnerable" | "unknown" {
  if (criticalCount > 0 || highCount > 5) {
    return "vulnerable";
  }
  if (totalVulnerabilities === 0) {
    return "secure";
  }
  if (highCount > 0 || totalVulnerabilities > 10) {
    return "vulnerable";
  }
  return "secure";
}

// Check all technologies and update their status
export async function checkAllTechnologies(
  getAllTechnologies: () => Promise<Technology[]>,
  updateTechnology: (id: string, updates: Partial<Technology>) => Promise<Technology | undefined>
): Promise<void> {
  const technologies = await getAllTechnologies();
  
  console.log(`Starting CVE check for ${technologies.length} technologies...`);
  
  for (const tech of technologies) {
    try {
      // Mark as checking
      await updateTechnology(tech.id, { status: "checking" });
      
      const { totalCount, criticalCount, highCount, topCves } = await fetchCvesForTechnology(tech);
      
      const status = determineSecurityStatus(totalCount, criticalCount, highCount);
      
      await updateTechnology(tech.id, {
        vulnerabilityCount: totalCount,
        criticalCount,
        highCount,
        topCves,
        status,
        lastCheckedAt: new Date(),
      });
    } catch (error) {
      console.error(`Failed to check ${tech.name}:`, error);
      await updateTechnology(tech.id, { status: "unknown" });
    }
  }
  
  console.log("CVE check complete for all technologies");
}

// Check a single technology
export async function checkSingleTechnology(
  tech: Technology,
  updateTechnology: (id: string, updates: Partial<Technology>) => Promise<Technology | undefined>
): Promise<Technology | undefined> {
  await updateTechnology(tech.id, { status: "checking" });
  
  const { totalCount, criticalCount, highCount, topCves } = await fetchCvesForTechnology(tech);
  
  const status = determineSecurityStatus(totalCount, criticalCount, highCount);
  
  return await updateTechnology(tech.id, {
    vulnerabilityCount: totalCount,
    criticalCount,
    highCount,
    topCves,
    status,
    lastCheckedAt: new Date(),
  });
}
