---
name: habitmeister-theme-and-ui
description: 'Use when changing HabitMeister themes, dark/light mode, action colors, contrast, settings appearance, modals, buttons, links, interactive accents, or Android-first UI styling. Covers the persisted theme and action-color systems and visual validation.'
user-invocable: true
---

# HabitMeister Theme And UI

## Purpose

Keep HabitMeister's visual system coherent while implementing UI features. Preserve the existing light/dark theme behavior, persisted action-color preference, local-first architecture, Android-first scope, and accessible contrast.

## Source Of Truth

- App shell and theme state: `App.tsx`
- Persisted settings and storage keys: `src/data/habitRepository.ts`
- Settings controls: `src/components/SettingsPanel.tsx`
- Premium UI: `src/components/PremiumScreen.tsx`
- Habit form popup: `src/components/HabitFormModal.tsx`
- Habit action popup: `src/components/HabitActionsModal.tsx`
- Delete-data popup: `src/components/DeleteLocalDataModal.tsx`

## Rules

1. Preserve the light theme as the default and preserve existing light-mode appearance unless the request explicitly changes it.
2. Treat `themeMode` as the source of truth for light/dark behavior. Do not create a second theme state in a component.
3. Treat the persisted `actionColor` as the source of truth for interactive accents. Do not hardcode `#286B69` for new links, active tabs, progress accents, outlines, selected controls, modal actions, or buttons.
4. Keep destructive actions visually distinct. Delete actions use the destructive red treatment; action color is used for cancel, navigation, neutral confirmation, and primary interactive accents.
5. In dark mode use near-black surfaces and light text. Primary text should be near-white, secondary text should be a readable muted light color, and borders/dividers should remain visible without becoming bright.
6. Every new or changed popup must support both theme modes. Check the modal backdrop, card surface, title, body copy, placeholders, borders, buttons, cancel action, success/error messages, and disabled state.
7. Do not use native Android `Alert.alert` for custom action menus or themed confirmations when the UI needs app theme or action-color control. Use a themed modal component instead.
8. Keep components presentational. Pass `themeMode` and `actionColor` through explicit props; keep persistence and behavior in `App.tsx` or the repository/service layer.
9. Avoid making habit colors or data colors accidentally inherit the action color. Habit color remains user-selected habit data; action color is reserved for interactive UI.
10. Keep layouts scrollable on Android when content can exceed viewport height, especially forms, Settings, Stats, and modal content.
11. Use accessible roles, labels, and selected/disabled states for color swatches, switches, radio-like controls, buttons, and modal actions.
12. Prefer named styles and theme-derived values over scattered inline literals. Small dynamic style overrides are acceptable when a value genuinely depends on a prop.

## Procedure

1. Inspect the current component and all call sites before editing. Check whether the user or formatter changed the file recently.
2. Search the touched UI surface for hardcoded palette values, especially `#286B69`, `#202A2A`, `#778080`, `#F7F3EC`, `#F0E8DC`, and `#E5DED3`.
3. Identify which colors are semantic:
   - page background
   - elevated surface
   - primary text
   - muted text
   - border/divider
   - action color
   - destructive action
   - habit data color
4. Make the smallest change that routes semantic action/theme values through existing props or state. Do not redesign unrelated screens.
5. For a new preference, add a repository key with a backward-compatible default, load it during app hydration, persist changes from Settings, and clear it in `clearLocalHabitData()`.
6. For a new popup, add explicit cancel/confirm behavior, theme-aware surfaces and text, action-color neutral actions, and destructive styling only where appropriate.
7. After the first edit, run the narrowest relevant test immediately. Then run TypeScript and lint before proceeding to adjacent files.
8. Run the full Jest suite before finishing a cross-component theme change.
9. Manually verify Android in both light and dark modes:
   - Settings theme toggle persists after restart.
   - Action-color selection updates visible accents.
   - Home, Manage, Stats, and Settings titles remain readable.
   - Add/edit, habit actions, Premium, and delete-data popups use the selected theme and action color.
   - Long surfaces scroll.
   - Destructive delete actions remain visibly distinct.

## Contrast Checklist

- Dark page background: near-black, not green-gray.
- Dark primary text: near-white.
- Dark secondary text: muted light gray-green with readable contrast.
- Dark cards: charcoal surfaces separated from the page background.
- Selected action-color controls: readable foreground text against the selected color.
- Gold action color: use dark foreground text when white would be low contrast.
- Light action colors: use white foreground text when contrast is sufficient.
- Avoid fixed dark text such as `#202A2A` on dark surfaces.
- Avoid fixed light surfaces such as `#F7F3EC` in dark-mode modals.

## Validation

Run from the HabitMeister project root:

```bash
npm test -- --runInBand
npx tsc --noEmit
npm run lint
```

For visual changes, also run the Android app and manually check both theme modes. Do not add AI features as part of theme or UI work.
