# SecureCheck Pro - Cybersecurity Assessment Tool

## Overview
A professional security check application for cybersecurity consultants. Run comprehensive security assessments on websites/domains and export detailed PDF reports. Features a futuristic cyberpunk design with neon cyan/purple colors, glassmorphism effects, and smooth animations.

## Key Features
- **Security Scan Form**: Configure assessments with target URL, check types, and scan depth
- **Multiple Check Types**: SSL/TLS, Security Headers, Vulnerability Scan, OWASP Top 10, Port Scan, DNS Security
- **CVE Technology Tracker**: Monitor 20+ technologies for vulnerabilities using NIST NVD database with automatic weekly updates
- **Detailed Explanations**: Each check type includes educational content about what's checked, why it matters, and estimated time
- **Real-time Progress**: Visual progress indicator with animated scan phases during execution
- **Detailed Results Dashboard**: Security score gauge, severity distribution pie chart, category bar chart, and detailed findings
- **PDF Export**: Professional PDF reports with all findings and recommendations
- **Dark/Light Theme**: Toggle between themes with cyberpunk aesthetic
- **Copyright**: © 2024 Malek Berrezouga

## Tech Stack
- **Frontend**: React, TanStack Query, Wouter, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Express.js, PostgreSQL (Drizzle ORM)
- **PDF Generation**: jsPDF with jspdf-autotable
- **CVE Data**: NIST National Vulnerability Database (NVD) API
- **Styling**: Custom CSS animations (pulse-glow, scan-line, cyber-pulse, float, gradient-shift), glassmorphism effects

## Design System
- **Primary Color**: Cyan (#00ffff) - Neon glow effects
- **Secondary Color**: Purple - Accent and gradients
- **Animations**: pulse-glow, scan-line, cyber-pulse, float, gradient-shift, border-glow
- **Effects**: Glassmorphism (.glass), Cyber grid background (.cyber-grid), Neon text (.neon-text)

## Project Structure
```
client/src/
├── components/
│   ├── ui/                    # shadcn UI components
│   ├── theme-provider.tsx     # Dark/light theme context
│   ├── theme-toggle.tsx       # Theme toggle button
│   ├── security-scan-form.tsx # Security assessment form with detailed check explanations
│   ├── scan-progress.tsx      # Animated scan progress view
│   └── scan-results.tsx       # Results dashboard with charts
├── pages/
│   ├── home.tsx               # Main application page with footer
│   └── not-found.tsx          # 404 page
└── App.tsx                    # Root component with routing

server/
├── index.ts                   # Express server entry
├── routes.ts                  # API route handlers
├── storage.ts                 # In-memory data storage
├── security-checks.ts         # Simulated security check logic
└── pdf-generator.ts           # PDF report generation

shared/
└── schema.ts                  # Shared TypeScript types, Zod schemas, and check type info
```

## API Endpoints
- `GET /api/scans` - List all scans
- `GET /api/scans/:id` - Get scan details
- `GET /api/scans/:id/findings` - Get scan findings
- `POST /api/scans` - Create new scan
- `PATCH /api/scans/:id/cancel` - Cancel running scan
- `GET /api/scans/:id/export` - Export PDF report

## Running the Application
The application runs on port 5000 using `npm run dev`.

## Deployment Instructions
1. **Local Development**: Run `npm run dev` to start the development server on port 5000
2. **Production Build**: Run `npm run build` to create a production build, then `npm start` to serve

## Saving Locally
1. Extract and run `npm install` followed by `npm run dev`

## Data Models
- **SecurityScan**: Target, status, configuration, timestamps, score
- **SecurityFinding**: Category, severity, title, description, evidence, recommendation
- **ScanConfig**: Check types array, scan depth, notes

## Severity Levels
- Critical (red) - Immediate action required
- High (orange) - Important security issues
- Medium (yellow) - Should be addressed
- Low (blue) - Minor concerns
- Info (gray) - Informational findings

## Recent Updates
- Added futuristic cyberpunk UI with neon colors and glassmorphism
- Added detailed educational content for each security check type
- Added Recharts for data visualization (pie chart, bar chart, score gauge)
- Added smooth animations and transitions
- Added copyright footer: © 2026 Malek Berrezouga
