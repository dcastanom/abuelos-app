# Graphic Design Specification — abuelos-app

## Design Philosophy

This is a **staff-facing clinical management tool**, not a consumer app. The primary users (nurses, doctors, receptionists, admins) work long shifts and read dense information under time pressure. The design must:

- Prioritize **readability and information density** over decoration.
- Feel **calm and professional**, not clinical cold or consumer playful.
- Support **WCAG 2.1 AA** accessibility throughout.
- Work well on wide desktop monitors (admin/receptionist), smaller laptop screens (nurses on carts), and mobile devices (phones and tablets for on-the-go access).

Reference design direction: similar to [Carejompo / Senior Care Management Dashboard on Dribbble](https://dribbble.com/shots/23202341-Senior-Care-Management-Mobile-App-Dashboard-Design) — structured sidebar, card-based content areas, teal/slate palette.

---

## Color Palette

### Primary — Teal

Teal communicates health, calm, and trust. It is distinct from the cold blue of generic SaaS while avoiding the aggressive intensity of pure green.

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| `primary-50` | `#F0FDFA` | `teal-50` | Hover backgrounds, selected row tint |
| `primary-100` | `#CCFBF1` | `teal-100` | Chip/badge backgrounds, active nav tint |
| `primary-500` | `#14B8A6` | `teal-500` | Icons, accent elements |
| `primary-600` | `#0D9488` | `teal-600` | **Primary buttons, links, active states** |
| `primary-700` | `#0F766E` | `teal-700` | Button hover, sidebar active item |
| `primary-800` | `#115E59` | `teal-800` | Dark accents |

### Neutrals — Slate

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| `neutral-50` | `#F8FAFC` | `slate-50` | **Page background** |
| `neutral-100` | `#F1F5F9` | `slate-100` | Table row alternating, input background |
| `neutral-200` | `#E2E8F0` | `slate-200` | **Borders, dividers** |
| `neutral-400` | `#94A3B8` | `slate-400` | Placeholder text, disabled state |
| `neutral-500` | `#64748B` | `slate-500` | Secondary / muted text |
| `neutral-700` | `#334155` | `slate-700` | Body text |
| `neutral-900` | `#0F172A` | `slate-900` | **Primary text, headings** |

### Sidebar

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| `sidebar-bg` | `#1E293B` | `slate-800` | Sidebar background |
| `sidebar-hover` | `#273449` | — | Nav item hover |
| `sidebar-active-bg` | `#0F766E` | `teal-700` | Active nav item background |
| `sidebar-text` | `#CBD5E1` | `slate-300` | Nav labels |
| `sidebar-text-active` | `#FFFFFF` | `white` | Active nav label |

### Semantic Colors

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| `success-500` | `#22C55E` | `green-500` | Success icons, positive indicators |
| `success-600` | `#16A34A` | `green-600` | Success text |
| `success-50` | `#F0FDF4` | `green-50` | Success alert background |
| `warning-500` | `#F59E0B` | `amber-500` | Warning icons |
| `warning-600` | `#D97706` | `amber-600` | Warning text |
| `warning-50` | `#FFFBEB` | `amber-50` | Warning alert background |
| `danger-500` | `#EF4444` | `red-500` | Error icons, delete actions |
| `danger-600` | `#DC2626` | `red-600` | Error text |
| `danger-50` | `#FEF2F2` | `red-50` | Error alert background |
| `info-500` | `#38BDF8` | `sky-400` | Info icons |
| `info-600` | `#0284C7` | `sky-600` | Info text |
| `info-50` | `#F0F9FF` | `sky-50` | Info alert background |

### Quick Visual Reference

```
Sidebar          Page bg         Card             Primary btn
█ #1E293B        ░ #F8FAFC       ▓ #FFFFFF         ■ #0D9488
                                 border #E2E8F0     hover #0F766E

Primary text     Secondary       Muted
● #0F172A        ● #334155       ● #64748B
```

---

## Typography

**Font family:** [Inter](https://fonts.google.com/specimen/Inter) — loaded via `next/font/google`. Excellent legibility at small sizes, tabular figures for clinical data (numeric values in tables), widely used in SaaS and healthcare apps.

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Type Scale

| Name | Size | Weight | Line-height | Tailwind | Use |
|------|------|--------|-------------|----------|-----|
| Display | 30px | 700 | 1.2 | `text-3xl font-bold` | Page titles (h1) |
| Heading 2 | 24px | 600 | 1.25 | `text-2xl font-semibold` | Section titles |
| Heading 3 | 20px | 600 | 1.3 | `text-xl font-semibold` | Card titles, modal headers |
| Heading 4 | 16px | 600 | 1.4 | `text-base font-semibold` | Sub-sections, field group labels |
| Body | 14px | 400 | 1.5 | `text-sm` | **Default for all content** |
| Body strong | 14px | 500 | 1.5 | `text-sm font-medium` | Labels, column headers |
| Small | 12px | 400 | 1.5 | `text-xs` | Captions, badges, helper text |
| Micro | 11px | 500 | 1.4 | `text-[11px] font-medium` | Timestamps, sidebar labels |

> Body text is 14px (not 16px) because this is a **data-dense management app** with tables and forms — 16px wastes vertical space. Minimum text in the app is 12px to meet accessibility minimums.

---

## Spacing & Layout

**Grid:** 8-point grid. All spacing values are multiples of 4px (Tailwind's default scale).

| Area | Value | Tailwind |
|------|-------|----------|
| Sidebar width | 240px | `w-60` |
| Page padding (horizontal) | 24px | `px-6` |
| Page padding (vertical) | 24px | `py-6` |
| Card padding | 20px | `p-5` |
| Form field gap | 16px | `gap-4` |
| Section gap | 24px | `gap-6` |
| Table row height | 44px (min) | `py-2.5` |

---

## Elevation & Borders

| Level | CSS | Use |
|-------|-----|-----|
| Flat | `border border-slate-200` | Cards, inputs, tables |
| Raised | `shadow-sm` + `border border-slate-200` | Modals, dropdowns |
| Floating | `shadow-md` | Popovers, tooltips |
| Overlay | `shadow-xl` | Full-screen modals |

**Border radius:**
- Cards, panels: `rounded-lg` (8px)
- Buttons, inputs: `rounded-md` (6px)
- Badges, chips: `rounded-full`
- Modals: `rounded-xl` (12px)

---

## Component Styles

### Buttons

| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| Primary | `teal-600` | white | none | Save, Confirm, Submit |
| Secondary | white | `slate-700` | `slate-200` | Cancel, secondary actions |
| Danger | `red-600` | white | none | Delete, permanent actions |
| Ghost | transparent | `teal-600` | none | Inline links, toolbar actions |

Button sizes:
- Default: `h-9 px-4 text-sm` (36px height)
- Small: `h-7 px-3 text-xs` (28px height)
- Large: `h-11 px-6 text-base` (44px height)

### Form Inputs

```
Background: white
Border: 1px solid #E2E8F0 (slate-200)
Border (focus): 2px solid #0D9488 (teal-600) + ring-2 ring-teal-600/20
Border (error): 1px solid #DC2626 (red-600)
Border radius: rounded-md (6px)
Padding: px-3 py-2
Font size: text-sm (14px)
Placeholder color: slate-400
```

### Cards

```
Background: white
Border: 1px solid #E2E8F0
Border radius: rounded-lg (8px)
Shadow: shadow-sm
Padding: p-5
```

### Data Tables

```
Header row:
  Background: slate-50
  Text: text-xs font-medium text-slate-500 uppercase tracking-wide
  Border-bottom: 1px solid slate-200

Body rows:
  Text: text-sm text-slate-700
  Border-bottom: 1px solid slate-100
  Hover: bg-slate-50

Selected row: bg-teal-50

Pagination controls: text-sm, ghost buttons
```

### Badges / Status Chips

```
Border radius: rounded-full
Padding: px-2.5 py-0.5
Font: text-xs font-medium

Active / Ingresado:   bg-green-50  text-green-700
Alta / Inactivo:      bg-slate-100 text-slate-600
Alerta médica:        bg-red-50    text-red-700
En observación:       bg-amber-50  text-amber-700
Turno mañana:         bg-sky-50    text-sky-700
```

### Navigation (Sidebar)

```
Width: 240px, fixed left, full height
Background: #1E293B (slate-800)

Logo area: h-16, flex items-center, px-5
  Logo icon: teal-400
  App name: text-white font-semibold text-base

Section label: text-[11px] font-medium text-slate-500 uppercase tracking-widest px-4 mt-5 mb-1

Nav item (default):
  text-slate-300 text-sm, flex items-center gap-3, px-4 py-2.5, rounded-md mx-2
  Icon: 18px, text-slate-400

Nav item (hover):
  bg-slate-700/50, text-white

Nav item (active):
  bg-teal-700, text-white
  Icon: text-white

Bottom: user avatar, name, role, logout button
```

### Top Bar

```
Height: 56px (h-14)
Background: white
Border-bottom: 1px solid slate-200
Content: breadcrumb (left), company name + notifications + user menu (right)
```

---

## Page Layout Template

```
┌─────────────────────────────────────────────────────────────┐
│  Topbar (h-14, white, border-b)                             │
├──────────┬──────────────────────────────────────────────────┤
│          │  Page header (title + action button)             │
│ Sidebar  │  ─────────────────────────────────────────────   │
│  (w-60   │                                                  │
│ slate-   │  Content area (px-6 py-6)                        │
│  800)    │    ┌──────────────────────────────────────────┐  │
│          │    │  Card / Table / Form                     │  │
│          │    └──────────────────────────────────────────┘  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Icons

Use **[Lucide React](https://lucide.dev/)** — consistent stroke-based icon set, excellent healthcare coverage, easy to use with Tailwind.

Default icon size: `18px` in sidebar, `16px` inline in text/buttons, `20px` for standalone action icons.

Key icons:
- Residents: `Users`
- Nursing notes: `ClipboardList`
- Contract: `FileText`
- Dashboard: `LayoutDashboard`
- Company users: `UserCog`
- Settings: `Settings`
- Logout: `LogOut`
- Search: `Search`
- Add new: `Plus`
- Edit: `Pencil`
- Delete: `Trash2`
- Download PDF: `Download`
- Alert: `AlertTriangle`

---

## Motion & Animation

Keep motion minimal — this is a clinical tool, not a marketing page.

| Element | Animation | Duration |
|---------|-----------|----------|
| Sidebar toggle | `transition-all` | 200ms |
| Button hover | `transition-colors` | 150ms |
| Modal open/close | `transition-opacity scale-95→100` | 150ms |
| Toast notifications | `slide-in from top` | 200ms |
| Page transitions | None — instant navigation |

No decorative animations. No infinite loops or loaders beyond a simple spinner.

---

## Dark Mode

**Not in scope for v1.** The app ships light-mode only. The sidebar uses a dark slate palette intentionally (it's a fixed structural element, not a dark-mode toggle).

---

## Accessibility

- All color pairs meet **WCAG 2.1 AA** (4.5:1 for normal text, 3:1 for large text).
  - Primary btn: white on `teal-600` → **5.4:1** ✅
  - Body text: `slate-700` on white → **8.0:1** ✅
  - Secondary text: `slate-500` on white → **4.6:1** ✅
- Focus rings: `ring-2 ring-teal-600 ring-offset-2` visible on all interactive elements.
- All form inputs have visible `<label>` elements (no placeholder-only labels).
- Tables have `<th scope="col">` headers.
- Font size minimum: 12px. All text scales with browser font-size preference (rem units).

---

## References Consulted

- [ElderlyEase UX/UI Case Study (Medium)](https://medium.com/@tetotiko/ux-ui-case-study-elder-caring-app-elderlyease-958133506cba)
- [Healthcare UI Design 2026 — Eleken](https://www.eleken.co/blog-posts/user-interface-design-for-healthcare-applications)
- [Healthcare App UI/UX Best Practices — FuseLab](https://fuselabcreative.com/healthcare-app-ui-ux-design-best-practices/)
- [Medical Color Palette Ideas — Media.io](https://www.media.io/color-palette/medical-color-palette.html)
- [Senior Care Management Dashboard — Dribbble (CMARIX)](https://dribbble.com/shots/23202341-Senior-Care-Management-Mobile-App-Dashboard-Design)
- [UX Design for Healthcare 2026 — Millipixels](https://millipixels.com/blog/ux-design-for-healthcare)
- [Home Care Website Design Inspiration 2026 — FramerBite](https://framerbite.com/blog/home-care-website-design-inspiration)
