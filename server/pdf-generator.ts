import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SecurityScan, SecurityFinding, Severity, ScanSummary } from "@shared/schema";
import { format } from "date-fns";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

const severityColors: Record<Severity, [number, number, number]> = {
  critical: [220, 38, 38],
  high: [234, 88, 12],
  medium: [202, 138, 4],
  low: [37, 99, 235],
  info: [107, 114, 128],
};

export function generatePdfReport(
  scan: SecurityScan,
  findings: SecurityFinding[]
): Buffer {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("Security Assessment Report", margin, yPos);
  yPos += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("SecureCheck Pro - Cybersecurity Assessment Tool", margin, yPos);
  yPos += 20;

  // Report metadata
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const metadata = [
    ["Target:", scan.target],
    ["Scan Date:", scan.completedAt ? format(new Date(scan.completedAt), "PPpp") : "N/A"],
    ["Scan Depth:", scan.configuration.scanDepth],
  ];

  if (scan.consultantName) {
    metadata.push(["Consultant:", scan.consultantName]);
  }
  if (scan.clientName) {
    metadata.push(["Client:", scan.clientName]);
  }
  if (scan.projectName) {
    metadata.push(["Project:", scan.projectName]);
  }

  for (const [label, value] of metadata) {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 30, yPos);
    yPos += 6;
  }
  yPos += 10;

  // Summary Section
  const summary: ScanSummary = {
    totalFindings: findings.length,
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    highCount: findings.filter((f) => f.severity === "high").length,
    mediumCount: findings.filter((f) => f.severity === "medium").length,
    lowCount: findings.filter((f) => f.severity === "low").length,
    infoCount: findings.filter((f) => f.severity === "info").length,
    overallScore: scan.overallScore || 0,
  };

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("Executive Summary", margin, yPos);
  yPos += 10;

  // Score box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos, 50, 30, 3, 3, "F");
  doc.setFontSize(24);
  doc.setTextColor(summary.overallScore >= 70 ? 22 : summary.overallScore >= 40 ? 202 : 220, 
                   summary.overallScore >= 70 ? 163 : summary.overallScore >= 40 ? 138 : 38,
                   summary.overallScore >= 70 ? 74 : summary.overallScore >= 40 ? 4 : 38);
  doc.text(String(summary.overallScore), margin + 25, yPos + 18, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Security Score", margin + 25, yPos + 26, { align: "center" });

  // Findings summary
  const summaryStartX = margin + 60;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const summaryItems = [
    { label: "Total Findings:", value: summary.totalFindings, color: [0, 0, 0] },
    { label: "Critical:", value: summary.criticalCount, color: severityColors.critical },
    { label: "High:", value: summary.highCount, color: severityColors.high },
    { label: "Medium:", value: summary.mediumCount, color: severityColors.medium },
    { label: "Low:", value: summary.lowCount, color: severityColors.low },
  ];

  let summaryY = yPos + 5;
  for (const item of summaryItems) {
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.setFont("helvetica", "bold");
    doc.text(item.label, summaryStartX, summaryY);
    doc.setFont("helvetica", "normal");
    doc.text(String(item.value), summaryStartX + 30, summaryY);
    summaryY += 5;
  }

  yPos += 40;

  // Findings Table
  if (findings.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Detailed Findings", margin, yPos);
    yPos += 8;

    const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
    const sortedFindings = [...findings].sort(
      (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    );

    const tableData = sortedFindings.map((finding, index) => [
      String(index + 1),
      finding.severity.toUpperCase(),
      finding.title,
      finding.category.replace(/_/g, " ").toUpperCase(),
      finding.affectedResource.substring(0, 30),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Severity", "Finding", "Category", "Resource"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { cellWidth: 35 },
        4: { cellWidth: 40 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const severity = data.cell.raw?.toString().toLowerCase() as Severity;
          if (severityColors[severity]) {
            data.cell.styles.textColor = severityColors[severity];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Detailed Findings
  if (findings.length > 0) {
    const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
    const sortedFindings = [...findings].sort(
      (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    );

    for (let i = 0; i < sortedFindings.length; i++) {
      const finding = sortedFindings[i];
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Finding header
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...severityColors[finding.severity]);
      doc.text(`[${finding.severity.toUpperCase()}] ${finding.title}`, margin, yPos);
      yPos += 7;

      // Description
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(finding.description, pageWidth - 2 * margin);
      doc.text(descLines, margin, yPos);
      yPos += descLines.length * 4 + 3;

      // Evidence
      if (finding.evidence) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Evidence:", margin, yPos);
        yPos += 4;
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const evidenceLines = doc.splitTextToSize(finding.evidence, pageWidth - 2 * margin);
        doc.text(evidenceLines, margin, yPos);
        yPos += evidenceLines.length * 3.5 + 3;
      }

      // Recommendation
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(22, 163, 74);
      doc.text("Recommendation:", margin, yPos);
      yPos += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const recLines = doc.splitTextToSize(finding.recommendation, pageWidth - 2 * margin);
      doc.text(recLines, margin, yPos);
      yPos += recLines.length * 4 + 8;

      // Separator
      if (i < sortedFindings.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
      }
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `SecureCheck Pro - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      `Generated: ${format(new Date(), "PPpp")}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
