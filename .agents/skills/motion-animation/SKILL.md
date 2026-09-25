---
name: motion-animation
description: "Build and edit React animations with Motion. Use for transitions, gestures, layout animation, or animated presence; skip for CSS-only animation work."
---

# Motion animations in React

Use the installed `motion` package and import React APIs from `motion/react`. Prefer Motion's declarative props and variants for coordinated animations; use CSS for simple decorative effects that do not need interaction or React state.

- Keep animation state in the component that owns the animated UI.
- Use `AnimatePresence` when elements need exit animations as they are removed.
- Respect reduced-motion preferences for nonessential movement.
- Reuse existing animation patterns and avoid adding another animation package.
- Keep transitions focused and short; do not animate layout or large areas without a clear user benefit.
