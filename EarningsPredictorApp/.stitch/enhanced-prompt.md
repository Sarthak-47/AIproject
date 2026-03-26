**Overall Approach:**
A clean, sophisticated financial dashboard for predicting stock earnings. The app emphasizes data reliability, machine learning insights, and clear visual signals (Beat/Miss).

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light, minimal, professional, trustworthy
- Background: Very subtle cool gray (#f8fafc)
- Surface: White (#ffffff) for cards with delicate borders and soft drop shadows
- Primary Accent: Slate Blue (#0f172a) for primary text, navigation, and core branding
- Success/Beat: Forest Green (#15803d) for positive signals and badges
- Danger/Miss: Crimson Red (#b91c1c) for negative signals and badges
- Text Primary: Deep Slate (#0f172a)
- Text Secondary: Muted Slate (#64748b)
- Fonts: Inter, sans-serif
- Components: Gently rounded corners (12px on large cards, 8px on buttons), structured grids, minimalist data displays

**Page Structure:**
1. **Home:** Centered search bar (shadcn Input), minimal branding, hero section
2. **StockDetail:** Key prediction card, Beat/Miss badge, ML probability progress bar, and 4 signal feature bars. Skeleton loading states during fetch.
3. **Performance:** Explanation cards detailing walk-forward validation and a Recharts bar chart for accuracy visualization.
