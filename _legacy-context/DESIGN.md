# Design System Document: The Intelligence Editorial

## 1. Overview & Creative North Star

**Creative North Star: The Cognitive Architect**
This design system moves away from the cluttered "dashboard-itis" common in Business Intelligence. Instead, it adopts the persona of a **Cognitive Architect**: a high-end, editorial-inspired environment where data is not just displayed, but curated. 

The aesthetic rejects the "boxed-in" nature of traditional SaaS. By using intentional asymmetry, generous white space (macro-typography), and a departure from structural lines, we create an experience that feels like a premium digital publication for the AI era. The goal is "High-Tech Serenity"—using sophisticated depth and tonal shifts to guide the user’s focus toward AI-generated insights without the cognitive load of a complex UI.

---

## 2. Colors: Tonal Depth vs. Structural Lines

This system leverages a monochromatic base with a high-performance primary blue to signal intelligence and action.

### The "No-Line" Rule
**Explicit Instruction:** Use of 1px solid borders for sectioning or containment is strictly prohibited. Boundaries must be defined solely through:
1. **Background Color Shifts:** Placing a `surface-container-low` component on a `surface` background.
2. **Negative Space:** Using the spacing scale to create groupings.
3. **Subtle Tonal Transitions:** Transitioning from `surface` to `surface-variant`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of frosted glass. 
- **Base Layer:** `surface` (#faf8ff) or `background`.
- **Lower Priority Containers:** `surface-container-low` for large, non-interactive areas.
- **High Priority/Interactive Cards:** `surface-container-lowest` (#ffffff) to create a "lift" effect against the slightly tinted background.
- **Active Navigation/Sidebars:** `surface-container-high` to provide a grounding anchor for the interface.

### The "Glass & Gradient" Rule
To elevate the AI experience, floating elements (modals, popovers, floating command bars) must use **Glassmorphism**:
- **Fill:** `surface` at 70% opacity.
- **Effect:** 20px - 40px Backdrop Blur.
- **Soul:** CTAs and Hero accents should use a subtle linear gradient from `primary` (#004ac6) to `primary_container` (#2563eb) at a 135-degree angle. This adds a "lithographic" quality that flat hex codes lack.

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance high-tech precision with human-centric readability.

*   **Display & Headlines (Manrope):** Bold, geometric, and authoritative. These are the "voice" of the AI. Use tight letter-spacing (-0.02em) for `display-lg` to create a compact, high-end feel.
*   **Body & Labels (Inter):** The "workhorse." Inter provides exceptional legibility for complex data strings and secondary insights.

**Visual Hierarchy Roles:**
- **Primary Insight:** `display-md` or `headline-lg` in `on_surface` (#191b23). Bold and unapologetic.
- **Secondary Narrative:** `body-lg` in `on_surface_variant` (#434655). Softened but legible.
- **Metadata/Labels:** `label-md` in `outline` (#737686). All-caps with +0.05em tracking for a "technical blueprint" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are replaced by **Ambient Luminosity**. 

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container` background creates an immediate, soft natural lift. 
*   **Ambient Shadows:** For floating elements (like the AI input bar), use a multi-layered shadow:
    *   *Shadow 1:* 0px 4px 20px rgba(25, 27, 35, 0.04)
    *   *Shadow 2:* 0px 12px 40px rgba(25, 27, 35, 0.08)
    *   *Color:* The shadow must be a tinted version of `on_surface`, never a neutral #000000.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### The AI Command Bar (Input Field)
*   **Style:** `surface-container-lowest` background, `xl` (1.5rem) roundedness.
*   **Shadow:** Ambient Shadow (see Section 4).
*   **Interaction:** On focus, the `outline` becomes a 2px `primary_container` glow with a 10% opacity spread.
*   **Leading Element:** Use a `primary` colored spark icon to denote AI capability.

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text, `md` (0.75rem) roundedness. No border.
*   **Secondary:** `surface-container-high` background with `on_surface_variant` text.
*   **Tertiary/Ghost:** No background. `primary` text. Underline only on hover.

### Data Cards
*   **Structure:** No dividers. Use `title-sm` for card headings and `body-md` for content.
*   **Separation:** Content groups within cards are separated by 24px - 32px of vertical white space, never a line.

### Interactive Chips
*   **Selection:** `primary_fixed` background with `on_primary_fixed_variant` text.
*   **Shape:** `full` (9999px) roundedness for a soft, pill-like feel.

### Additional Component: The "Insight Stream"
A vertical layout pattern using `surface-container-low` as a background track, where AI "thought" cards (`surface-container-lowest`) animate in, utilizing the **Layering Principle** to show progression.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetric layouts. Align a headline to the left and the primary action to the far right with a significant "void" in between to create breathing room.
- **Do** use `primary_fixed` for background highlights on text you want the user to notice without using a "Warning" or "Error" state.
- **Do** treat typography as a graphical element. Let large `display-lg` type dominate the page.

### Don't:
- **Don't** use 100% black (#000000) for text. Always use `on_surface` (#191b23) for a more sophisticated, ink-like appearance.
- **Don't** use standard 4px or 8px grid-style borders. They make the BI tool look like a generic spreadsheet.
- **Don't** use harsh drop shadows. If the shadow is the first thing you notice, it is too heavy.
- **Don't** use dividers. If two pieces of information feel messy together, increase the padding (`xl` or `2xl`) instead of adding a line.