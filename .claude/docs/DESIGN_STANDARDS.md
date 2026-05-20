# Figma Design Standards (Design-First Approach)

Дизайн — джерело істини для React Native компонентів та Flexbox-стилізації.

## 1. Pages & Frames
* `🎨 Foundations` (colors, typography, spacing), `🧱 Components`, `📱 Screens`, `🕹️ Prototypes`
* Frame names = `expo-router` file names: `login.tsx`, `active-workout.tsx`

## 2. Foundations
* **Colors**: Figma Variables — semantic names (`brand/primary`, `text/muted`, not `blue/500`)
* **Typography**: `H1`, `H2`, `Body/Regular`, `Body/Bold`, `Caption`
* **Spacing**: 8pt grid; create `space/4`, `space/8`, `space/16`, `space/24` variables

## 3. Components (Auto Layout REQUIRED)
* All components must use Auto Layout → translates to Flexbox/React Native
* **Variants**: Default, Active, Disabled, Loading states via Component Sets
* **Boolean props**: Icons visible/hidden, labels optional
* **Naming**: PascalCase — `WorkoutCard`, `PrimaryButton` → same as `.tsx` file names

## 4. Mobile Specifics
* Touch targets: 44x44pt minimum
* Safe areas: StatusBar (top) + Home Indicator (bottom)
* Responsiveness: "Fill container" for responsive widths

## 5. Handover
* Layer names clear: `Container`, `Title`, `Icon` (not "Frame 1243")
* Icons: vectors in square frames (24x24+) for export
* Annotate complex interactions

## 6. Before Coding
Verify: (1) design tokens used in Figma, (2) Auto Layout nesting = View/Text hierarchy