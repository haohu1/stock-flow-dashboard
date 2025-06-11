# Stock-Flow Dashboard Styling Analysis

## Overview
This document analyzes the styling patterns across different tabs and components in the stock-flow-dashboard application to identify inconsistencies and create recommendations for a unified design system.

## Current Design System

### Color Palette
- **Primary Color**: `#3b82f6` (Blue-500)
- **Secondary Color**: `#10b981` (Green-500)
- **Dark Mode Support**: Yes, using Tailwind's dark mode classes
- **Background Colors**:
  - Light: `rgb(255, 255, 255)` 
  - Dark: `rgb(15, 23, 42)` (Slate-900)

### Global CSS Classes
From `globals.css`:
- `.btn`: Base button styling with padding and transitions
- `.btn-primary`: Blue background with white text
- `.btn-secondary`: Green background with white text
- `.input`: Basic input styling with border and focus states

## Component Analysis by Tab

### 1. Dashboard Tab (`Dashboard.tsx`)
**Headers & Titles:**
- Main cards: `text-sm font-medium text-gray-500 dark:text-gray-400`
- Section headers: `text-lg font-semibold text-gray-800 dark:text-white`

**Cards/Panels:**
- Standard card: `bg-white dark:bg-gray-800 rounded-lg shadow p-4`
- Scenarios section: `bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow p-4`
- Getting started: `bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700`

**Metrics Display:**
- Value text: `text-2xl font-bold text-gray-800 dark:text-white`
- Change indicators: `text-green-500` (positive) / `text-red-500` (negative)

**Inconsistencies:**
- Mixed use of padding (`p-4` vs `p-6`)
- Different border styles (some with borders, some without)
- Inconsistent shadow usage

### 2. Scenarios Tab (`ScenarioManager.tsx`)
**Headers:**
- Tab header: `text-xl font-bold text-gray-900 dark:text-white mb-6`
- Section headers: `text-lg font-semibold text-gray-800 dark:text-white`

**Cards:**
- Main container: `bg-white dark:bg-gray-800 rounded-lg shadow`
- Nested sections: `bg-gray-50 dark:bg-gray-700 rounded-lg p-4`

**Buttons:**
- Primary action: `bg-indigo-600 text-white hover:bg-indigo-700`
- Secondary: `bg-gray-200 dark:bg-gray-600 hover:bg-gray-300`
- Danger: `text-red-600 hover:text-red-800`

### 3. AI Interventions Tab (`AIInterventionManager.tsx`)
**Headers:**
- Main: `text-xl font-bold text-gray-900 dark:text-white`
- Subsections: `text-lg font-semibold text-gray-800 dark:text-white`

**Cards:**
- Intervention cards: `bg-white dark:bg-gray-800 rounded-lg shadow-md p-6`
- Active state: `ring-2 ring-blue-500`
- Info boxes: Various colored backgrounds (`bg-orange-50`, `bg-green-50`, etc.)

**Inconsistencies:**
- Different shadow depths (`shadow` vs `shadow-md`)
- Varied padding sizes
- Mixed color schemes for info boxes

### 4. Sensitivity Analysis Tab (`SensitivityAnalysis.tsx`)
**Headers:**
- Main: `text-lg font-semibold text-gray-800 dark:text-white`

**Layout:**
- Container: `bg-white dark:bg-gray-800 rounded-lg shadow p-4`
- Heat map cells: Custom color gradients

**Forms:**
- Labels: `text-sm font-medium text-gray-700 dark:text-gray-300`
- Inputs: Uses global `.input` class

### 5. Parameters Tab (`ParametersPanel.tsx`)
**Section Headers:**
- Collapsible groups: Icon + `text-lg font-semibold text-gray-800 dark:text-white`

**Parameter Rows:**
- Hover state: `hover:bg-gray-50 dark:hover:bg-gray-700`
- Labels: `text-sm font-medium text-gray-700 dark:text-gray-300`
- Input fields: Custom styling, not using global `.input` class

**Inconsistencies:**
- Custom input styling instead of global class
- Different hover behaviors

### 6. Equations Tab (`EquationExplainer.tsx`)
**Section Design:**
- Collapsible sections: `border border-gray-200 dark:border-gray-700 rounded-lg`
- Section headers: `px-6 py-4 bg-gray-50 dark:bg-gray-800`

**Info Boxes:**
- Quick reference: `bg-blue-50 dark:bg-blue-900/20 border border-blue-200`
- Disease params: Multiple colored boxes with `/20` opacity in dark mode

### 7. Clinical Guide Tab (`ClinicalParameterGuide.tsx`)
**Headers:**
- Main: `text-xl font-bold text-gray-900 dark:text-white`

**Content Boxes:**
- Disease sections: Custom colored backgrounds
- Evidence boxes: `bg-gray-50 dark:bg-gray-800`

### 8. Bubble Chart Tabs
**Canvas:**
- SVG-based D3 visualizations
- Custom tooltip styling

**Controls:**
- Filter buttons: `px-3 py-1 rounded-md text-sm`

## Tables (`ResultsTable.tsx`)
**Structure:**
- Header: `bg-gray-50 dark:bg-gray-800`
- Body: `bg-white dark:bg-gray-800`
- Dividers: `divide-gray-200 dark:divide-gray-700`
- Cell padding: `px-6 py-4`
- Text: `text-sm text-gray-500 dark:text-gray-300`

## Major Inconsistencies Identified

### 1. **Typography**
- Headers vary between `text-lg`, `text-xl`, and `text-2xl`
- Font weights inconsistent (`font-semibold` vs `font-bold`)
- Text colors vary (`text-gray-800` vs `text-gray-900`)

### 2. **Spacing**
- Padding: `p-4` vs `p-6` vs `px-6 py-4`
- Margins: `mb-4` vs `mb-6`
- No consistent spacing scale

### 3. **Cards/Panels**
- Shadow usage: `shadow` vs `shadow-md` vs no shadow
- Border radius: Always `rounded-lg` (consistent)
- Borders: Sometimes included, sometimes not

### 4. **Buttons**
- Primary buttons use different color intensities
- Inconsistent hover states
- Size variations not standardized

### 5. **Forms**
- Input styling not consistently using global `.input` class
- Label styling varies
- Different focus states

### 6. **Color Usage**
- Info/alert boxes use many different color schemes
- Dark mode opacity values inconsistent (`/20` vs solid colors)
- Status colors (success/error) not standardized

### 7. **Layout**
- Container widths not standardized
- Different approaches to responsive design
- Inconsistent use of flexbox vs grid

## Recommendations for Unified Design System

### 1. **Typography Scale**
```css
/* Headings */
.h1 { @apply text-2xl font-bold text-gray-900 dark:text-white; }
.h2 { @apply text-xl font-semibold text-gray-900 dark:text-white; }
.h3 { @apply text-lg font-semibold text-gray-800 dark:text-white; }
.h4 { @apply text-base font-medium text-gray-800 dark:text-white; }

/* Body Text */
.text-body { @apply text-sm text-gray-600 dark:text-gray-400; }
.text-muted { @apply text-xs text-gray-500 dark:text-gray-500; }
```

### 2. **Spacing System**
- Use consistent scale: 2, 4, 6, 8, 12, 16, 20, 24
- Standard card padding: `p-6`
- Standard section margins: `mb-6`

### 3. **Component Classes**
```css
/* Cards */
.card { @apply bg-white dark:bg-gray-800 rounded-lg shadow p-6; }
.card-compact { @apply bg-white dark:bg-gray-800 rounded-lg shadow p-4; }
.card-colored { @apply rounded-lg p-6; } /* For colored backgrounds */

/* Buttons */
.btn-sm { @apply px-3 py-1.5 text-sm; }
.btn-md { @apply px-4 py-2 text-base; }
.btn-lg { @apply px-6 py-3 text-lg; }

/* Status Colors */
.text-success { @apply text-green-600 dark:text-green-400; }
.text-error { @apply text-red-600 dark:text-red-400; }
.text-warning { @apply text-yellow-600 dark:text-yellow-400; }
.text-info { @apply text-blue-600 dark:text-blue-400; }
```

### 4. **Form Standardization**
```css
.form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2; }
.form-input { @apply w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white; }
.form-select { @apply form-input; }
```

### 5. **Info Box Variants**
```css
.info-box { @apply p-4 rounded-lg border; }
.info-box-blue { @apply info-box bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800; }
.info-box-green { @apply info-box bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800; }
.info-box-yellow { @apply info-box bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800; }
.info-box-red { @apply info-box bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800; }
```

### 6. **Table Standardization**
```css
.table-container { @apply overflow-x-auto; }
.table { @apply min-w-full divide-y divide-gray-200 dark:divide-gray-700; }
.table-header { @apply bg-gray-50 dark:bg-gray-800; }
.table-body { @apply bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700; }
.table-cell { @apply px-6 py-4 text-sm; }
```

## Implementation Priority

1. **High Priority**
   - Standardize typography across all components
   - Unify card/panel styling
   - Consistent button styles

2. **Medium Priority**
   - Form element standardization
   - Table styling consistency
   - Color system for status/info boxes

3. **Low Priority**
   - Animation/transition consistency
   - Icon usage standardization
   - Loading state patterns

## Next Steps

1. Create a `design-system.css` file with all standardized classes
2. Update `globals.css` to import the design system
3. Refactor components to use consistent classes
4. Create a style guide component for reference
5. Document the design system in a README

This unified design system will improve:
- Visual consistency across the application
- Maintainability and developer experience
- User experience through predictable patterns
- Performance through reduced CSS duplication