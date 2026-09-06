# HabitMeister Shipaton Implementation Plan

Date: 2026-09-02
Status: Active implementation / MVP core complete

## Project goal

Build a polished habit tracking app for the Shipaton competition, launched as a fresh app identity separate from the older internal testing app. The app should be local-first, use Firebase Auth for identity, and integrate RevenueCat for a premium subscription tier.

## Product decisions

### Free tier

- 5 active habits max
- basic habit tracking
- daily completion and streaks
- calendar/history view
- reminders
- offline use
- settings and personalization

### Premium tier

- unlimited active habits
- advanced analytics / insights
- data export
- additional premium features later

### Core principle

The core habit loop stays free. Premium adds capacity and advanced value, not basic habit completion.

## Architecture

### Layer 1: App/UI

- home screen
- habit list
- create/edit habit form
- completion/today screen
- history/calendar screen
- settings screen
- premium upgrade / paywall screen

### Layer 2: State and business logic

- habit repository abstraction
- local persistence for habits and completions
- Firebase Auth identity layer
- premium entitlement checks

### Layer 3: Data storage

- Local-first by default
- AsyncStorage for MVP
- optional Firestore sync later, not required for first release

### Layer 4: Monetization

- RevenueCat SDK
- premium entitlement
- restore purchases
- in-app purchase flow

## App MVP scope

### Must-have screens

1. Onboarding
2. Habit list
3. Add / edit habit
4. Today / completion flow
5. Calendar / history
6. Settings
7. Premium / upgrade screen

### Must-have features

- create habits
- edit habits
- delete habits
- complete habits for the day
- see streaks and progress
- track history
- add habit reminder times
- local persistence
- offline-first behavior
- premium gating and upgrade path

### Nice-to-have but not required for launch

- analytics dashboard
- export feature
- multiple theme packs
- gamified streak visuals
- AI insights

## Implementation order

### Phase 1: foundation

- scaffold app
- install dependencies
- configure TypeScript and project settings
- set up navigation
- create app shell and theme

### Phase 2: auth and local data layer

- Firebase Auth setup
- sign in / sign up flow
- local storage repository
- habit model and completion model
- data persistence utilities

### Phase 3: core habit loop

- habit creation
- habit editing
- habit deletion
- completion tracking
- streak logic
- history and calendar

### Phase 4: premium and monetization

- RevenueCat setup
- entitlement provider
- premium upgrade flow
- 5-habit free-tier enforcement
- premium-only features gating

### Phase 5: launch polish

- onboarding UX
- upgrade dialog design
- icons and app store visuals
- test flows for premium and free users
- final QA

### Phase 6: release prep

- app store metadata
- privacy and terms if needed
- release build on Android and iOS
- first public release during Shipaton window

## RevenueCat plan

### Entitlement

- entitlement key: premium

### Free flow

- allow up to 5 active habits
- show upgrade prompt when trying to exceed limit

### Premium flow

- unlock unlimited habits
- unlock analytics / export
- show premium features only when entitlement is active

### Important rules

- RevenueCat owns subscription state
- app logic checks entitlements before enabling premium features
- habit data stays local and is not treated as a premium indicator

## Free tier enforcement behavior

When a user is not premium and attempts to add a sixth active habit:

- block the creation
- show a premium upgrade prompt
- keep existing habits and history intact
- continue allowing editing and deletion of existing habits

## Product UX goals

- fast setup and obvious value in under 2 minutes
- simple habit creation flow
- progress feedback that feels motivating
- clean premium upsell that does not disrupt the app

## Store eligibility strategy

- new repo
- new app identity
- new package name / bundle ID
- new public store release during Shipaton window
- RevenueCat integration present before first release

## Definition of done for v1

- app builds and runs
- user can create habits and complete them
- streak logic works
- free tier limit works
- premium user can unlock premium features
- app is stable enough for a public launch
- shipaton entry can be released as a first public build

## Risks and mitigations

### Risk: scope creep

Mitigation: keep only the MVP feature set until premium flow and launch polish are complete.

### Risk: monetization complexity

Mitigation: start with one premium entitlement and one upgrade flow.

### Risk: ambiguous app store eligibility

Mitigation: use a fresh app identity and a fresh public release window.

### Risk: too much backend complexity

Mitigation: keep Firestore optional and local-first for the initial release.

## Recommended app name for the project

HabitMeister

## Reuse strategy from the previous app

Yes, the existing interface can be reused heavily, but only as a source for reusable UI and product patterns. The goal is to keep the new Shipaton app fresh while reusing the parts that are genuinely valuable.

### Safe to reuse

- habit list layout
- add/edit habit forms
- completion and streak UI
- settings screens
- premium upgrade UI
- theme and styling patterns
- local-first habit state logic
- entitlement and gating patterns

### Not safe to reuse directly

- app identity / bundle ID / package name
- release metadata or store configuration
- Firebase project config tied to the old app
- any app-specific launch history or internal test setup
- old branding that would make the new app look like an update rather than a fresh entry

### Recommended approach

- copy screens and components into the new project as a clean baseline
- rename and rebrand where needed
- rewire app config and project setup to the new app identity
- keep the architecture clean and competition-safe instead of simply cloning the old build

This keeps the project moving quickly without risking a fresh-release rule problem.

## Notes for the next implementation pass

### Progress checkpoint: 2026-09-02

The local-first MVP core is implemented and validated. The next session should
resume with the native RevenueCat purchase flow.

#### Completed

- React Native app shell, theme, and tab-based navigation.
- Local AsyncStorage habit repository.
- Backward-compatible habit data normalization and malformed-record handling.
- Dated completion history and streak calculations.
- Today progress, seven-day history, settings, and premium screens.
- Habit creation, editing, deletion, and daily completion.
- Optional reminder-time field with strict `HH:MM` validation.
- Five-active-habit free-tier gate.
- First-launch onboarding with local completion persistence.
- RevenueCat SDK dependency installed.
- RevenueCat entitlement boundary with `premium` entitlement key.
- Free fallback when no API key is configured.
- Fail-closed behavior for RevenueCat configuration and network errors.
- Lifecycle guards for asynchronous app startup updates.
- Regression tests for storage, migration, dates, streaks, reminders,
  onboarding, entitlement state, and failure paths.

#### Current validation

- Jest: 3 suites, 13 tests passed.
- TypeScript: 0 errors.
- ESLint: 0 errors.

#### Not yet implemented

- RevenueCat product offerings, purchase flow, and restore purchases.
- Real RevenueCat public SDK key in `src/config.ts`.
- Firebase Auth sign-in, sign-up, session persistence, and user identity.
- Native notification permissions and scheduled reminder notifications.
- Full calendar interaction beyond the seven-day history summary.
- Premium-only analytics and export features.
- Release builds, store metadata, privacy/terms, and final QA.

#### Resume order

1. Add RevenueCat offerings, purchase, restore, loading, and error states.
2. Add Firebase Auth behind an identity service boundary.
3. Add native reminder scheduling and cancellation.
4. Expand tests for purchase outcomes, auth state, and notification permissions.
5. Complete launch polish and release preparation.

#### Configuration note

`src/config.ts` intentionally contains an empty RevenueCat API key. Replace it
with the platform-appropriate public SDK key before testing real purchases.

- Start by creating folders for app, screens, components, services, storage, and providers.
- Use a minimal navigation shell and a simple app state model.
- Reuse screen patterns from the previous app, but keep the new project identity and config independent.
- Validate the premium checks before adding more advanced features.
- Keep the first release honest, polished, and narrow.

## Current implementation checkpoint

Date: 2026-09-02

### Completed

- Replaced the React Native starter screen with the HabitMeister Today screen.
- Added local habit completion state and progress feedback.
- Added the create-habit modal with required name validation.
- Added the five-active-habit free-tier guard.
- Added AsyncStorage persistence through `src/data/habitRepository.ts`.
- Added the AsyncStorage Jest mock.
- Fixed the async Jest teardown failure by awaiting hydration with React Test Renderer `act` and unmounting the renderer.
- Current validation is green: `npm test -- --runInBand` and `npm run lint`.

### Partially complete

- Habit edit and delete handlers have been added.
- Habit row action controls have been added.
- Bottom-tab selection state and tab buttons have been added.
- The Today view is still the only fully implemented tab content.

### Resume here

1. Finish the History and Settings tab views and verify tab switching.
2. Add focused tests for completion, adding, editing, deleting, and the five-habit limit.
3. Improve the habit data model to track completion history by date instead of one persistent `completed` boolean.
4. Continue with reminders, onboarding, and premium entitlement work from the phase order above.
