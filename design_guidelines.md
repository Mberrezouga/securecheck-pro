# Design Guidelines: Security Check Application

## Design Approach
**Design System**: Material Design with Carbon Design System influences for professional, data-heavy interface
**Rationale**: Security professionals require trust, clarity, and efficiency. Material's structured approach combined with Carbon's enterprise-focused patterns creates credibility while maintaining usability.

## Typography System
- **Primary Font**: Inter (Google Fonts) - excellent readability for technical content
- **Headers**: Font weights 600-700, sizes from text-3xl (hero) down to text-lg (section headers)
- **Body Text**: Font weight 400-500, text-base for forms and content, text-sm for labels and metadata
- **Monospace**: JetBrains Mono for security codes, hashes, technical identifiers (text-sm)
- **Hierarchy**: Clear distinction between section titles, subsection headers, data labels, and result values

## Layout System
**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16
- Container: max-w-7xl with consistent px-4 md:px-6 lg:px-8
- Section padding: py-8 to py-16 for main areas
- Card/component gaps: gap-6 for grids, gap-4 for form fields
- Component internal padding: p-6 for cards, p-4 for smaller modules

## Core Structure

### Header
- Full-width navigation bar with app logo/title
- Active security scan indicator (if running)
- User account menu
- Export/download button (prominent when results available)

### Main Application Layout
**Three-Stage Progressive Interface**:

1. **Input Stage** (Left-aligned form, max-w-3xl):
   - Security check configuration panel
   - Input fields for URLs/domains/IP addresses
   - Checkboxes for scan types (SSL, Headers, Vulnerabilities, OWASP Top 10)
   - Scan depth/intensity selector
   - Clear, large "Run Security Check" button

2. **Processing Stage**:
   - Progress indicator with current scan phase
   - Real-time status updates in card format
   - Estimated time remaining
   - Cancel scan option

3. **Results Stage** (Full-width layout):
   - Summary dashboard (4-column grid on desktop, stacked mobile)
     - Overall security score (large, prominent)
     - Critical issues count
     - Warnings count
     - Passed checks count
   - Detailed findings accordion/expandable sections
   - Issue severity indicators (clear visual hierarchy)
   - Recommendation cards for each finding

### Results Display Components
- **Severity Badges**: Pill-shaped, text-xs font-semibold with consistent sizing
- **Findings Cards**: White backgrounds with subtle borders, p-6 spacing
  - Issue title (text-lg font-semibold)
  - Technical details (monospace font for codes/paths)
  - Description paragraph (text-sm)
  - Remediation steps (numbered list)
  - Reference links (external documentation)
- **Data Tables**: For detailed technical findings
  - Sticky headers
  - Alternating row treatment for readability
  - Sortable columns
  - Responsive: cards on mobile, table on desktop

### Footer Actions Bar
- Fixed bottom bar when results available
- Export to PDF button (primary, prominent)
- Save report button
- Share report options
- Print-friendly version link

## Component Library

### Forms
- Input fields: h-12 with clear labels above (text-sm font-medium)
- Textareas: min-h-32 for multi-line inputs
- Select dropdowns: Consistent height with inputs
- Checkboxes/radios: Larger touch targets (w-5 h-5)
- Field grouping: Related fields in bordered sections with p-4

### Buttons
- Primary: px-6 py-3, text-base, font-semibold, rounded-lg
- Secondary: Similar sizing with outline treatment
- Danger (for cancel/delete): Distinct but not alarming
- Icon buttons: w-10 h-10 for utility actions

### Cards
- Consistent rounded-xl borders
- p-6 internal padding
- Subtle shadow for elevation
- Clear hover states for interactive cards

### Data Visualization
- Progress bars: h-2 rounded-full for scan progress
- Status indicators: Circular dots (w-3 h-3) with labels
- Score displays: Large numerical values (text-4xl to text-6xl) with context labels

## Images
**Minimal use**: This is a data-focused professional tool
- Small brand logo in header (h-8)
- Security badge/seal graphics in summary dashboard (w-16 h-16)
- No hero image - immediate functional interface
- Optional: Small illustrative icons within empty states

## Accessibility
- Consistent form label associations
- ARIA labels for all interactive elements
- Keyboard navigation throughout
- Focus indicators on all interactive components
- High contrast for text readability
- Screen reader friendly status updates during scans

## Animation Philosophy
**Minimal and purposeful only**:
- Smooth transitions for accordion/expandable sections (duration-200)
- Scan progress indicator animation
- Loading states during processing
- NO decorative animations

## Mobile Considerations
- Single column layout for forms and results
- Bottom sheet for export options
- Sticky header with condensed navigation
- Cards stack vertically
- Tables convert to card format with key information