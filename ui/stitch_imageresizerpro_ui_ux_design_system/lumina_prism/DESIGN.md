# Design System Specification: The Fluid Luminary

## 1. Overview & Creative North Star: "The Digital Atelier"
This design system moves away from the rigid, boxed-in nature of traditional SaaS dashboards. Our Creative North Star is **"The Digital Atelier"**—a space that feels like a high-end physical studio: airy, curated, and effortlessly tactile. 

To achieve this, we reject the "template" look. We break the grid through intentional asymmetry, using oversized typography to anchor the eye while allowing secondary elements to float in a soft, layered environment. The goal is to make image processing feel less like a utility and more like a creative ritual.

## 2. Color Philosophy & Tonal Depth
We utilize a palette of soft lavenders and deep indigos, punctuated by high-energy magentas and teals.

### The "No-Line" Rule
**Borders are forbidden.** Traditional 1px solid borders create visual noise. In this system, boundaries are defined exclusively through:
*   **Color Shifts:** A `surface-container-low` section sitting on a `surface` background.
*   **Tonal Transitions:** Using `surface-container-lowest` for the most interactive, elevated cards to create a natural "pop" against `surface-container`.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-paper sheets.
*   **Base Layer:** `surface` (#faf4ff)
*   **Structural Sections:** `surface-container-low` (#f4eeff)
*   **Primary Content Cards:** `surface-container-lowest` (#ffffff)
*   **Interaction Overlays:** `surface-container-high` (#e6deff)

### The "Glass & Gradient" Rule
To inject "soul" into the dashboard, use **Glassmorphism** for floating sidebars or modal overlays. 
*   **Formula:** `surface-container` at 70% opacity + 24px Backdrop Blur.
*   **Signature Textures:** For primary CTAs and progress bars, use a linear gradient: `primary` (#4647d3) to `primary-container` (#9396ff) at a 135-degree angle. This adds a sense of light and dimension that flat hex codes cannot replicate.

## 3. Typography: The Editorial Voice
We pair the geometric precision of **Plus Jakarta Sans** with the approachable clarity of **Manrope**.

*   **Display & Headlines (Plus Jakarta Sans):** These are your "Editorial Anchors." Use `display-lg` (3.5rem) for empty states or welcome headers. The tight kerning and bold weights convey a "Professional Gallery" feel.
*   **Titles & Body (Manrope):** `title-md` and `body-lg` are optimized for readability. Manrope’s open apertures keep the "Friendly" promise of the brand, ensuring that even complex technical data feels accessible.
*   **Labeling:** Use `label-md` in `on-surface-variant` (#5e5680) for metadata. The slight color shift ensures hierarchy without needing to bold every element.

## 4. Elevation & Depth
We eschew traditional drop shadows in favor of **Tonal Layering** and **Ambient Light.**

*   **The Layering Principle:** Depth is achieved by "nesting" tokens. A `surface-container-lowest` card should live inside a `surface-container` area. This creates a soft, sophisticated lift.
*   **Ambient Shadows:** If a card must "float" (e.g., a dragging image state), use an ultra-diffused shadow: `0px 24px 48px rgba(48, 41, 80, 0.06)`. Note the use of `on-surface` (#302950) as the shadow base rather than pure black, ensuring the shadow feels like a natural extension of the UI.
*   **The "Ghost Border" Fallback:** For accessibility in high-glare environments, use a "Ghost Border": `outline-variant` (#b0a7d6) at 15% opacity. It should be felt, not seen.

## 5. Component Logic

### Buttons & Chips
*   **Primary Button:** Uses the Signature Gradient (`primary` to `primary-container`). Border radius set to `full` (9999px) to emphasize the friendly, organic nature of the brand.
*   **Chips:** Use `secondary-container` (#ffc1d6) with `on-secondary-container` (#8e0054) text. Radius set to `sm` (0.5rem) for a distinct "tag" feel compared to buttons.

### Cards & Lists
*   **No Dividers:** Never use horizontal rules (`<hr>`). Separate list items using 12px of vertical white space or by alternating background tints between `surface-container-low` and `surface-container`.
*   **Card Radius:** Standard cards must use `md` (1.5rem). Hero cards or "Upload Zones" use `lg` (2rem).

### Inputs & Fields
*   **State Styling:** Active inputs should not just change border color; they should transition from `surface-container-high` to `surface-container-lowest` to physically "lift" toward the user.
*   **Error State:** Use `error` (#b41340) for text, but use a soft `error_container` (#f74b6d) at 10% opacity for the field background to avoid an overly aggressive "warning" look.

### Specialized Image Components
*   **The "Processing" Glass Overlay:** When an image is being resized, overlay it with a `tertiary_container` (#53ddfc) glass tint at 40% opacity with a pulsing animation.
*   **Comparison Slider:** Use `primary` (#4647d3) for the slider handle, utilizing a `full` roundness to match the "Friendly" brand pillar.

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Place a large `headline-lg` on the left with a floating `surface-container-lowest` card offset to the right.
*   **Use Generous Padding:** If you think there is enough white space, add 16px more. The system thrives on "Breathing Room."
*   **Layer Tones:** Always place lighter containers on darker surfaces to create "Elevation."

### Don’t:
*   **Don't use 100% Black:** Even for text, use `on-background` (#302950). Pure black breaks the soft, premium aesthetic.
*   **Don't use Sharp Corners:** The minimum radius is `sm` (0.5rem). Sharp corners feel "Legacy" and "Rigid."
*   **Don't use Heavy Borders:** High-contrast lines create "Visual Friction" and make the dashboard feel like a spreadsheet.