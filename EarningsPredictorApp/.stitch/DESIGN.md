# Design System: Stock Earnings Predictor
**Project ID:** 5255691031192155212

## 1. Visual Theme & Atmosphere
The Stock Earnings Predictor has a professional, clean, and trustworthy atmosphere. It feels like a high-end financial tool designed for precision and clarity. It avoids clutter, using generous whitespace and subtle boundaries to separate different pieces of information. The vibe is "Sophisticated Financial Dashboard."

## 2. Color Palette & Roles
* **Page Background** (#f8fafc): A very subtle, cool light gray to reduce eye strain and provide contrast for white surface cards.
* **Surface White** (#ffffff): Used for all main content cards, specifically the Prediction Card and Performance metrics.
* **Deep Slate Primary** (#0f172a): Used for main headings, navigation text, and primary emphasis. Conveys authority and stability.
* **Muted Slate** (#64748b): Used for secondary text, labels, and chart axes.
* **Forest Green** (#15803d): Used strictly for "BEAT" signals, positive performance badges, and healthy progress bars.
* **Crimson Red** (#b91c1c): Used strictly for "MISS" signals, negative indicators, and error states.
* **Border Gray** (#e2e8f0): Used for delicate delineations (shadcn Separators) and card borders.

## 3. Typography Rules
* **Font Family:** Inter or system sans-serif (clean, modern, highly legible at small sizes).
* **Headers:** Bold (700 weight), using Deep Slate Primary. Hero headers are large and tightly tracked for impact.
* **Body/Data:** Regular (400 weight). 
* **Numbers/Probabilities:** Emphasized with bold weights and large sizes (e.g., 3rem for the Beat probability %).

## 4. Component Stylings
* **Buttons (shadcn Button):** Subtly rounded corners (8px). Primary buttons use Deep Slate background with white text. Hover states slightly lighten the background.
* **Cards (shadcn Card):** Gently rounded corners (12px) with a 1px solid Border Gray outline and a whisper-soft, diffused shadow (large elevation only on hover or focus). 
* **Inputs (shadcn Input):** 8px rounding, clean Border Gray stroke. Expands slightly or gains a soft blue ring on focus.
* **Badges (shadcn Badge):** Pill-shaped (fully rounded). Color corresponds cleanly to the signal (Green for Beat, Red for Miss).
* **Progress Bars (shadcn Progress):** Slim height (8px), full pill rounding. Fill color matches the primary or status color.

## 5. Layout Principles
* **Alignment:** Centered max-width constraints (typically ~700px for StockDetail, 1000px for Performance).
* **Spacing:** Strict adherence to an 8px grid (using 16px, 24px, 40px gaps).
* **Responsiveness:** Desktop-first but mobile-responsive, utilizing flexbox for graceful wrapping of feature bars.
