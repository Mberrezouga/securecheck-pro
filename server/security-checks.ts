import type { CheckType, Severity, InsertSecurityFinding } from "@shared/schema";

interface FindingTemplate {
  title: string;
  description: string;
  recommendation: string;
  severity: Severity;
  evidence?: string;
  referenceLinks?: string[];
  complianceTags?: string[];
}

const sslFindings: FindingTemplate[] = [
  {
    title: "TLS 1.0/1.1 Enabled",
    description: "The server supports deprecated TLS versions (1.0 and 1.1) which have known security vulnerabilities.",
    recommendation: "Disable TLS 1.0 and 1.1, and only support TLS 1.2 or higher.",
    severity: "high",
    evidence: "Supported protocols: TLSv1.0, TLSv1.1, TLSv1.2, TLSv1.3",
    referenceLinks: ["https://www.ssllabs.com/ssltest/"],
    complianceTags: ["PCI-DSS 4.0", "NIST 800-52"],
  },
  {
    title: "Weak Cipher Suites",
    description: "The server supports weak cipher suites that could be exploited by attackers.",
    recommendation: "Configure the server to use only strong cipher suites with AES-256-GCM or ChaCha20.",
    severity: "medium",
    evidence: "Weak ciphers found: TLS_RSA_WITH_AES_128_CBC_SHA, TLS_RSA_WITH_3DES_EDE_CBC_SHA",
    referenceLinks: ["https://wiki.mozilla.org/Security/Server_Side_TLS"],
    complianceTags: ["PCI-DSS", "HIPAA"],
  },
  {
    title: "Certificate Expiring Soon",
    description: "The SSL certificate will expire within 30 days.",
    recommendation: "Renew the SSL certificate before expiration to prevent service disruption.",
    severity: "medium",
    evidence: "Certificate expires: 2024-02-15T23:59:59Z",
  },
  {
    title: "Missing OCSP Stapling",
    description: "OCSP Stapling is not enabled, which may slow down TLS handshakes.",
    recommendation: "Enable OCSP Stapling to improve connection performance and privacy.",
    severity: "low",
  },
];

const headerFindings: FindingTemplate[] = [
  {
    title: "Missing Content-Security-Policy",
    description: "The Content-Security-Policy header is not set, leaving the application vulnerable to XSS attacks.",
    recommendation: "Implement a strict Content-Security-Policy header to prevent XSS and data injection attacks.",
    severity: "high",
    evidence: "Response headers do not include Content-Security-Policy",
    referenceLinks: ["https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"],
    complianceTags: ["OWASP A7"],
  },
  {
    title: "Missing X-Frame-Options",
    description: "The X-Frame-Options header is not set, making the site vulnerable to clickjacking attacks.",
    recommendation: "Set X-Frame-Options to 'DENY' or 'SAMEORIGIN' to prevent clickjacking.",
    severity: "medium",
    evidence: "X-Frame-Options header not present",
    referenceLinks: ["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options"],
  },
  {
    title: "Strict-Transport-Security Not Set",
    description: "HSTS header is not configured, allowing potential downgrade attacks.",
    recommendation: "Enable HSTS with a minimum max-age of 31536000 seconds (1 year).",
    severity: "medium",
    evidence: "Strict-Transport-Security header missing",
    complianceTags: ["OWASP", "PCI-DSS"],
  },
  {
    title: "X-Content-Type-Options Missing",
    description: "The X-Content-Type-Options header is not set to 'nosniff'.",
    recommendation: "Add X-Content-Type-Options: nosniff to prevent MIME type sniffing.",
    severity: "low",
  },
  {
    title: "Referrer-Policy Not Configured",
    description: "No Referrer-Policy header is set, potentially leaking sensitive URL information.",
    recommendation: "Set Referrer-Policy to 'strict-origin-when-cross-origin' or 'no-referrer'.",
    severity: "low",
  },
];

const vulnerabilityFindings: FindingTemplate[] = [
  {
    title: "Outdated Server Software",
    description: "The server is running an outdated version of Apache/nginx with known vulnerabilities.",
    recommendation: "Update to the latest stable version of the web server software.",
    severity: "critical",
    evidence: "Server: Apache/2.4.29 (Ubuntu) - CVE-2021-44790 applies",
    referenceLinks: ["https://nvd.nist.gov/vuln/detail/CVE-2021-44790"],
    complianceTags: ["CVE-2021-44790"],
  },
  {
    title: "Directory Listing Enabled",
    description: "Directory listing is enabled on the server, exposing file structure to attackers.",
    recommendation: "Disable directory listing in the web server configuration.",
    severity: "medium",
    evidence: "Directories /uploads/ and /backup/ are publicly listable",
  },
  {
    title: "Sensitive Files Exposed",
    description: "Sensitive configuration files are accessible from the web.",
    recommendation: "Remove or restrict access to sensitive files like .env, config.php, web.config.",
    severity: "high",
    evidence: "Accessible files: /.env (200 OK), /config.php.bak (200 OK)",
  },
];

const owaspFindings: FindingTemplate[] = [
  {
    title: "SQL Injection Vulnerability",
    description: "The application is vulnerable to SQL injection attacks in the search parameter.",
    recommendation: "Use parameterized queries or prepared statements for all database operations.",
    severity: "critical",
    evidence: "Parameter 'search' vulnerable: /api/products?search=1' OR '1'='1",
    referenceLinks: ["https://owasp.org/Top10/A03_2021-Injection/"],
    complianceTags: ["OWASP A03:2021", "CWE-89"],
  },
  {
    title: "Cross-Site Scripting (XSS)",
    description: "Reflected XSS vulnerability found in the comment parameter.",
    recommendation: "Implement proper input validation and output encoding for all user inputs.",
    severity: "high",
    evidence: "Payload '<script>alert(1)</script>' reflected in response",
    referenceLinks: ["https://owasp.org/www-community/attacks/xss/"],
    complianceTags: ["OWASP A07:2021", "CWE-79"],
  },
  {
    title: "Broken Authentication",
    description: "Session tokens are predictable and could be brute-forced.",
    recommendation: "Use cryptographically secure session token generation.",
    severity: "high",
    complianceTags: ["OWASP A07:2021", "CWE-287"],
  },
  {
    title: "Insecure Direct Object References",
    description: "User IDs in URLs can be manipulated to access other users' data.",
    recommendation: "Implement proper authorization checks on all data access operations.",
    severity: "high",
    evidence: "Changing /api/users/123 to /api/users/124 returns different user data",
    complianceTags: ["OWASP A01:2021"],
  },
];

const portFindings: FindingTemplate[] = [
  {
    title: "SSH Port Exposed",
    description: "SSH port (22) is exposed to the internet without IP restrictions.",
    recommendation: "Restrict SSH access to specific IP addresses using firewall rules.",
    severity: "medium",
    evidence: "Port 22/tcp open ssh OpenSSH 7.6p1",
  },
  {
    title: "Database Port Exposed",
    description: "Database port is publicly accessible, increasing attack surface.",
    recommendation: "Close database ports to public access and use VPN or SSH tunneling.",
    severity: "high",
    evidence: "Port 3306/tcp open mysql MySQL 5.7.32",
  },
  {
    title: "Unnecessary Services Running",
    description: "Multiple unnecessary services are exposed on various ports.",
    recommendation: "Disable or firewall any services not required for the application.",
    severity: "low",
    evidence: "Open ports: 21/FTP, 23/Telnet, 8080/HTTP-Proxy",
  },
];

const dnsFindings: FindingTemplate[] = [
  {
    title: "Missing DNSSEC",
    description: "DNSSEC is not enabled for the domain, making it vulnerable to DNS spoofing.",
    recommendation: "Enable DNSSEC at the domain registrar level.",
    severity: "medium",
    referenceLinks: ["https://www.cloudflare.com/dns/dnssec/how-dnssec-works/"],
  },
  {
    title: "SPF Record Missing",
    description: "No SPF record found, making the domain susceptible to email spoofing.",
    recommendation: "Add an SPF record to specify authorized mail servers.",
    severity: "medium",
    evidence: "No TXT record with v=spf1 prefix found",
    complianceTags: ["Email Security"],
  },
  {
    title: "DMARC Not Configured",
    description: "DMARC policy is not set up for email authentication.",
    recommendation: "Implement DMARC with at least p=quarantine policy.",
    severity: "low",
  },
];

const findingsByCheckType: Record<CheckType, FindingTemplate[]> = {
  ssl_tls: sslFindings,
  security_headers: headerFindings,
  vulnerability_scan: vulnerabilityFindings,
  owasp_top_10: owaspFindings,
  port_scan: portFindings,
  dns_security: dnsFindings,
};

export function generateFindings(
  scanId: string,
  target: string,
  checkTypes: CheckType[],
  depth: "quick" | "standard" | "deep"
): InsertSecurityFinding[] {
  const findings: InsertSecurityFinding[] = [];
  
  const findingProbability = {
    quick: 0.3,
    standard: 0.5,
    deep: 0.7,
  };
  
  for (const checkType of checkTypes) {
    const templates = findingsByCheckType[checkType];
    
    for (const template of templates) {
      if (Math.random() < findingProbability[depth]) {
        findings.push({
          scanId,
          category: checkType,
          severity: template.severity,
          title: template.title,
          description: template.description,
          recommendation: template.recommendation,
          affectedResource: target,
          evidence: template.evidence,
          referenceLinks: template.referenceLinks,
          complianceTags: template.complianceTags,
        });
      }
    }
  }
  
  return findings;
}

export function calculateSecurityScore(findings: { severity: Severity }[]): number {
  if (findings.length === 0) return 100;
  
  const severityDeductions: Record<Severity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };
  
  let totalDeduction = 0;
  for (const finding of findings) {
    totalDeduction += severityDeductions[finding.severity];
  }
  
  return Math.max(0, Math.min(100, 100 - totalDeduction));
}
