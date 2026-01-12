import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScanSchema, insertTechnologySchema } from "@shared/schema";
import { generateFindings, calculateSecurityScore } from "./security-checks";
import { generatePdfReport } from "./pdf-generator";
import { checkAllTechnologies, checkSingleTechnology } from "./nvd-service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all scans
  app.get("/api/scans", async (req, res) => {
    try {
      const scans = await storage.getAllScans();
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  // Get a single scan
  app.get("/api/scans/:id", async (req, res) => {
    try {
      const scan = await storage.getScan(req.params.id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }
      res.json(scan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan" });
    }
  });

  // Get findings for a scan
  app.get("/api/scans/:id/findings", async (req, res) => {
    try {
      const findings = await storage.getFindings(req.params.id);
      res.json(findings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch findings" });
    }
  });

  // Create a new scan
  app.post("/api/scans", async (req, res) => {
    try {
      const parseResult = insertScanSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }

      const scan = await storage.createScan(parseResult.data);
      
      // Start the scan simulation
      await storage.updateScan(scan.id, { status: "running" });

      // Simulate scan processing (in a real app, this would be a background job)
      const scanDuration = {
        quick: 3000,
        standard: 5000,
        deep: 8000,
      };

      setTimeout(async () => {
        try {
          // Generate findings based on check types and depth
          const findingsData = generateFindings(
            scan.id,
            scan.target,
            scan.configuration.checkTypes,
            scan.configuration.scanDepth
          );

          // Store findings
          for (const finding of findingsData) {
            await storage.createFinding(finding);
          }

          // Calculate score and update scan
          const score = calculateSecurityScore(findingsData);
          await storage.updateScan(scan.id, {
            status: "completed",
            completedAt: new Date().toISOString(),
            overallScore: score,
          });
        } catch (error) {
          await storage.updateScan(scan.id, { status: "failed" });
        }
      }, scanDuration[scan.configuration.scanDepth]);

      res.status(201).json(scan);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scan" });
    }
  });

  // Cancel a scan
  app.patch("/api/scans/:id/cancel", async (req, res) => {
    try {
      const scan = await storage.getScan(req.params.id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      if (scan.status !== "running" && scan.status !== "pending") {
        return res.status(400).json({ error: "Scan cannot be cancelled" });
      }

      const updatedScan = await storage.updateScan(req.params.id, {
        status: "cancelled",
        completedAt: new Date().toISOString(),
      });

      res.json(updatedScan);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel scan" });
    }
  });

  // Export scan as PDF
  app.get("/api/scans/:id/export", async (req, res) => {
    try {
      const scan = await storage.getScan(req.params.id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      if (scan.status !== "completed") {
        return res.status(400).json({ error: "Scan not completed yet" });
      }

      const findings = await storage.getFindings(req.params.id);
      const pdfBuffer = generatePdfReport(scan, findings);

      const filename = `security-report-${scan.id}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // ==================== TECHNOLOGY CVE ROUTES ====================

  // Seed technologies on startup
  await storage.seedTechnologies();

  // Get all technologies
  app.get("/api/technologies", async (req, res) => {
    try {
      const techs = await storage.getAllTechnologies();
      res.json(techs);
    } catch (error) {
      console.error("Failed to fetch technologies:", error);
      res.status(500).json({ error: "Failed to fetch technologies" });
    }
  });

  // Add a new technology
  app.post("/api/technologies", async (req, res) => {
    try {
      const parseResult = insertTechnologySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }

      const tech = await storage.createTechnology(parseResult.data);
      res.status(201).json(tech);
    } catch (error) {
      console.error("Failed to create technology:", error);
      res.status(500).json({ error: "Failed to create technology" });
    }
  });

  // Delete a technology
  app.delete("/api/technologies/:id", async (req, res) => {
    try {
      await storage.deleteTechnology(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete technology:", error);
      res.status(500).json({ error: "Failed to delete technology" });
    }
  });

  // Check all technologies for CVEs
  app.post("/api/technologies/check", async (req, res) => {
    try {
      // Run check in background
      checkAllTechnologies(
        () => storage.getAllTechnologies(),
        (id, updates) => storage.updateTechnology(id, updates)
      ).catch(err => console.error("Background CVE check failed:", err));

      res.json({ message: "CVE check started", status: "running" });
    } catch (error) {
      console.error("Failed to start CVE check:", error);
      res.status(500).json({ error: "Failed to start CVE check" });
    }
  });

  // Check a single technology
  app.post("/api/technologies/:id/check", async (req, res) => {
    try {
      const tech = await storage.getTechnology(req.params.id);
      if (!tech) {
        return res.status(404).json({ error: "Technology not found" });
      }

      const updated = await checkSingleTechnology(
        tech,
        (id, updates) => storage.updateTechnology(id, updates)
      );

      res.json(updated);
    } catch (error) {
      console.error("Failed to check technology:", error);
      res.status(500).json({ error: "Failed to check technology" });
    }
  });

  // Setup weekly check scheduler (every 7 days)
  const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
  setInterval(() => {
    console.log("Running scheduled weekly CVE check...");
    checkAllTechnologies(
      () => storage.getAllTechnologies(),
      (id, updates) => storage.updateTechnology(id, updates)
    ).catch(err => console.error("Scheduled CVE check failed:", err));
  }, WEEK_IN_MS);

  return httpServer;
}
