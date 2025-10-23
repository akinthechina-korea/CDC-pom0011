# Design Guidelines: Container Damage Inspection System

## Design Approach
**Selected Framework:** Material Design with Enterprise Enhancements
**Rationale:** This utility-focused logistics application requires clarity, efficiency, and mobile responsiveness. Material Design provides excellent component patterns for forms, data tables, and workflow visualization while maintaining professional appearance across roles.

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 25 70% 47% (Deep Blue - professional, trustworthy)
- Primary Variant: 220 85% 35% (Darker blue for emphasis)
- Secondary: 280 50% 60% (Purple for field staff sections)
- Success: 142 71% 45% (Green for completed/approved states)
- Warning: 38 92% 50% (Orange for driver submissions/pending)
- Error: 0 84% 60% (Red for rejections/critical issues)
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 45%

**Dark Mode:**
- Primary: 220 80% 65%
- Background: 220 20% 12%
- Surface: 220 18% 16%
- Text Primary: 220 5% 95%

**Role-Specific Accent Colors:**
- Driver: 38 92% 50% (Warm orange)
- Field Staff: 280 50% 60% (Purple)
- Office Staff: 220 70% 47% (Corporate blue)

### B. Typography

**Font Families:**
- Primary (Korean/English): 'Noto Sans KR' (Google Fonts)
- Secondary/Headings: 'Inter' (Google Fonts)
- Monospace (Container/B/L Numbers): 'JetBrains Mono'

**Type Scale:**
- Hero/Page Title: text-3xl md:text-4xl, font-bold (30px/36px)
- Section Headers: text-2xl md:text-3xl, font-semibold (24px/30px)
- Card Titles: text-lg md:text-xl, font-bold (18px/20px)
- Body Text: text-base (16px)
- Labels: text-sm, font-medium (14px)
- Captions/Metadata: text-xs (12px)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 md:p-6
- Section spacing: space-y-6 md:space-y-8
- Card gaps: gap-4 md:gap-6
- Form field spacing: space-y-4

**Container Widths:**
- Mobile: Full width with px-4 padding
- Desktop: max-w-7xl mx-auto px-6

**Grid Systems:**
- Report Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard Stats: grid-cols-2 md:grid-cols-4
- Form Layouts: Single column mobile, 2-column desktop where appropriate

### D. Component Library

**Navigation:**
- Top app bar with role indicator badge
- Bottom navigation for mobile (driver/field roles)
- Sidebar navigation for desktop (office role)
- Breadcrumb navigation for multi-step workflows

**Role Selection (Landing):**
- Three large card buttons with icons
- Hover state: subtle lift (shadow-lg) and scale (scale-105)
- Icon-first design with clear role descriptions

**Report Cards:**
- Elevated cards with subtle shadow (shadow-md)
- Color-coded left border indicating status (4px)
- Compact header with container number and status badge
- Collapsible detail sections for each role's input
- Timestamp metadata in muted text

**Status Badges:**
- Rounded-full pills with role-specific colors
- Small text (text-xs) with medium font weight
- Subtle background (opacity-10 of primary color)

**Forms:**
- Outlined input fields with focus ring
- Clear label-input relationship
- Floating labels on focus (Material Design pattern)
- Helper text below inputs for format guidance
- Error states with red outline and error message

**Signature Capture:**
- Canvas-based signature pad with clear border
- White background on surface elevation
- "Clear" and "Done" action buttons
- Preview of captured signature
- Mobile-optimized touch interaction

**Data Tables (File Upload Preview):**
- Zebra striping for row alternation
- Sticky header on scroll
- Responsive: horizontal scroll on mobile, full table on desktop
- Clear column headers with sort indicators

**Action Buttons:**
- Primary: Filled buttons with primary color
- Secondary: Outlined buttons with primary color border
- Danger: Filled buttons with error color
- Floating Action Button (FAB) for new report (mobile)

**Status Workflow Visualization:**
- Horizontal stepper showing: Driver → Field → Office → Complete
- Active step highlighted with primary color
- Completed steps with check icons in success color
- Connecting lines between steps

### E. Animations

**Minimal, Purposeful Animation:**
- Card hover: Subtle lift with 200ms ease transition
- Page transitions: 150ms fade
- Status updates: Success checkmark bounce (300ms)
- Signature capture: Stroke animation as drawing occurs
- No background animations or decorative motion

## Role-Specific Design Patterns

**Driver Interface:**
- Mobile-first design with large touch targets (min 44px)
- Prominent "New Report" FAB
- List view of submitted reports with rejection alerts
- Quick-access to rejected reports for resubmission
- Camera integration hints for damage photo upload

**Field Staff Interface:**
- Tablet-optimized layout
- Queue view of pending driver submissions
- Side-by-side comparison: driver report vs. field verification
- Quick approval/rejection actions with reason modal
- Field signature pad prominently placed

**Office Staff Interface:**
- Desktop-optimized dashboard
- Multi-column layout with stats overview
- Advanced filtering and search capabilities
- Batch operations for multiple reports
- PDF download preview and generation
- Comprehensive history log

## Key UX Patterns

**Authentication:**
- Simple card-based login for drivers (vehicle number + phone PIN)
- Clear error messaging
- Auto-focus on first input field

**Report Workflow:**
- Clear visual progression through stages
- Inline editing where appropriate
- Confirmation dialogs for destructive actions (rejection)
- Auto-save drafts with visual indicator

**Data Upload:**
- Drag-and-drop CSV upload area
- File validation feedback with success/error states
- Preview table before confirmation
- Sample file download link

**PDF Generation:**
- Maintain company letterhead branding
- Clear document structure with Korean headers
- Signature fields preserved
- Professional formatting for printing

## Responsive Behavior

**Mobile (< 768px):**
- Single column layouts
- Bottom navigation bar
- Full-width cards and forms
- Collapsible sections to reduce scroll
- Touch-optimized signature pad

**Desktop (≥ 768px):**
- Multi-column dashboard
- Sidebar navigation
- Side-by-side comparisons
- Expanded card views with all details visible

## Brand Elements

**Cheonil International Logistics Identity:**
- Subtle company color accent in header
- Logo placement: top-left on desktop, centered on mobile
- Professional, corporate aesthetic
- Korean language prioritized in all UI text
- Company address and contact in footer

This design system creates a professional, efficient, and role-appropriate interface for the container damage inspection workflow while maintaining visual consistency and usability across all user types.