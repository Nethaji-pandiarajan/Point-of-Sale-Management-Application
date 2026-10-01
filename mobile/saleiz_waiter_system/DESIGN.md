---
name: SALEIZ Waiter System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5c403d'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#906f6c'
  outline-variant: '#e5bdb9'
  surface-tint: '#bc131d'
  primary: '#a30012'
  on-primary: '#ffffff'
  primary-container: '#c91f24'
  on-primary-container: '#ffdfdc'
  inverse-primary: '#ffb3ac'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#005d21'
  on-tertiary: '#ffffff'
  tertiary-container: '#00782d'
  on-tertiary-container: '#8fff9b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#93000f'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#82fc92'
  tertiary-fixed-dim: '#66de79'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#00531d'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-table-num:
    fontFamily: inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md-bold:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  label-numeric:
    fontFamily: inter
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-badge:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption-sm:
    fontFamily: inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  touch-min: 3rem
  screen-margin-mobile: 1rem
  bottom-nav-height: 4.25rem
  action-bar-height: 4.5rem
---

## Brand & Style

The design system powers an operational, mission-critical handheld application tailored for high-volume restaurant service staff. It marries speed, ergonomic utility, and culinary professionalism. 

The experience is optimized for waiters walking, standing, and moving through low-to-bright lighting conditions. Cognitive friction is eliminated through instant glanceability, high contrast ratios, and tactile responsiveness. The style embodies **Modern Utilitarian Elegance**—crisp, refined geometry combined with tactile status indicators that instill control, dependability, and calm during high-stress peak dining rushes.

## Colors

The color architecture is calibrated around rapid status recognition across a busy restaurant floor:

- **Primary Core**: `#C91F24` (Crimson) for primary actions, active tabs, and identity anchors. `#A9151A` (Deep Crimson) handles active press states. `#FFF1F1` serves as the selected tint background.
- **Surface & Foundation**: `#F7F8FA` provides an off-white, anti-glare canvas, while `#FFFFFF` isolates individual orders, tables, and cart lists on dedicated cards.
- **Content Contrast**: `#171717` (True Neutral 900) ensures zero optical ambiguity for order items, table numbers, and quantities; `#667085` (Slate Neutral 500) handles timestamps, seat indices, and secondary descriptors.
- **Structural Lines**: `#E7E9EE` acts as the subtle boundary border between nested blocks and card peripheries.
- **Operational Floor Statuses**:
  - *Available / Ready / Completed*: `#22A447` with container tint `#E8F7ED`
  - *Occupied / In Service*: `#2563EB` with container tint `#EFF6FF`
  - *Preparing / Pending Kitchen*: `#F59E0B` with container tint `#FEF3C7`
  - *Alert / Urgent / Overdue*: `#DC2626` with container tint `#FEE2E2`

## Typography

The typography strategy prioritizes legibility at arm's length. Numeric values, table IDs, elapsed ticket timers, and item counts utilize tabular figures with pronounced font weights (`700` and `800`) to prevent visual drift during rapid scrolling. 

Clear structural line heights ensure that ticket modifications (e.g., "NO ONION", "EXTRA SPICY") read with immediate distinction beneath main menu titles.

## Layout & Spacing

The layout is built for one-handed thumb-reach operations across standard mobile restaurant POS devices and consumer mobile hardware.

- **Grid System**: Single-column flexible flow on standard mobile screens with a permanent `16px` outer gutter. For table grid overviews, a dual-column or triple-column responsive grid is used with strict `12px` gaps.
- **Touch Targets**: All operational interactive zones maintain a minimum height and width of `48px` (`3rem`), including quantity steppers, checkbox targets, status change switches, and table cards.
- **Vertical Hierarchy**: Critical active order summaries and kitchen fire triggers are anchored inside the sticky bottom viewport zone, hovering above the bottom navigation bar.

## Elevation & Depth

Visual hierarchy leverages crisp card separation, subtle border outlines, and functional ambient drops to avoid heavy visual noise in dim service environments:

- **Level 0 (Floor Background)**: `#F7F8FA` base canvas.
- **Level 1 (Cards & Structural Modules)**: `#FFFFFF` resting on `#F7F8FA`, bordered by a uniform `1px solid #E7E9EE`. Ambient shadow: `0px 2px 4px rgba(23, 23, 23, 0.04)`.
- **Level 2 (Active/Selected Card & Modals)**: Border upgrades to `1.5px solid #C91F24` with shadow `0px 8px 16px -4px rgba(201, 31, 36, 0.08), 0px 4px 6px -2px rgba(23, 23, 23, 0.03)`.
- **Level 3 (Fixed Bottom Action Bar & Navigation)**: Floating surface with a top separator `1px solid #E7E9EE` and an elevated drop shadow: `0px -4px 16px rgba(23, 23, 23, 0.06)`.

## Shapes

The interface embraces a structured, ergonomic softness:

- **Cards & Sheets**: Defined with an explicit `16px` (`1rem`) border radius, offering friendly, clean compartmentalization for table groups and bill receipts.
- **Interactive Buttons & Form Fields**: Set to `12px` (`0.75rem`) to remain solid and easily tap-targetable.
- **Status Badges & Pill Chips**: Full capsule pills (`9999px`) to immediately distinguish system states from actionable buttons.

## Components

### Buttons
- **Primary CTA**: `#C91F24` background, `#FFFFFF` text, `48px` minimum height, `12px` border radius, bold typography. Active state scales to `0.98` with background `#A9151A`.
- **Secondary / Action Outline**: `#FFFFFF` background, `#171717` text, `1.5px solid #E7E9EE`.
- **Destructive Action**: `#FFF1F1` container, `#DC2626` text and icon.

### Status Badges & Chips
- Formatted as full capsule pills with `8px` horizontal padding and `4px` vertical padding.
- Consists of a filled status dot (`6px`), high-contrast label, with paired container-tint background and `1px` tinted border (e.g., Table Ready: `#E8F7ED` background, `#22A447` text and dot).

### Table Cards (Floor View)
- `16px` rounded white container with `1px solid #E7E9EE`.
- Prominent top left Table Number (`display-table-num`), paired with real-time status pill on the top right.
- Center displays guest capacity and current order elapsed time (`label-numeric`).
- Dynamic border shift matching status color when active.

### Order Item List & Stepper
- Clean horizontal rows with separator rules `#E7E9EE`.
- Left-aligned bold quantity badge (`#FFF1F1` container, `#C91F24` text), followed by item name and modifiers.
- Inline numeric stepper buttons: `36x36px` touch bounds minimum with bold plus/minus iconography.

### Sticky Order Action Bar
- Pinned to bottom right above navigation; height `72px`.
- Left module displays real-time item count and total bill calculation.
- Right module features a prominent full-width action trigger (e.g., "Send to Kitchen" or "Proceed to Bill").

### Bottom Navigation Bar
- Height `68px`, white surface with top border `#E7E9EE`.
- 4 primary destinations: Home, Tables, Orders, Profile.
- Active item uses `#C91F24` with a subtle `3px` top indicator line or colored icon-and-label combination. Inactive items rest at `#667085`.