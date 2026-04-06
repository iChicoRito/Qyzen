# WebApp To APK Design

## Summary

Build an Android-installable APK for Qyzen by wrapping the deployed production web app inside a Capacitor Android shell. The Android app must not be implemented as a pure PWA. The mobile wrapper should preserve the current Next.js and Supabase architecture, add minimal native configuration, and provide a simple offline-required experience when the hosted app cannot load.

## Goals

- Produce an Android APK that installs and launches Qyzen through Capacitor
- Load the production deployment as the single web source
- Preserve existing web authentication, routing, and Supabase-backed behavior
- Show a clear offline-required experience when the app starts without connectivity
- Keep implementation scoped to Android packaging and wrapper stability

## Non-Goals

- No broad offline-first feature work
- No migration of the web app into a pure PWA flow
- No local packaging of the full Next.js app bundle for runtime
- No unrelated refactors to existing web routes, Supabase modules, or dashboard features
- No iOS delivery in this feature

## Requirements Source

Source requirements come from `prompts/WebAppToAPK.md`, interpreted as:

- Convert the current web app into a downloadable APK using Capacitor
- Avoid solving the requirement by turning the product into a standard PWA-only install flow

## Recommended Approach

Use Capacitor as a native Android container that opens the deployed production Qyzen URL in a WebView. This approach keeps the current architecture intact, minimizes risk around Next.js server behavior and API routes, and delivers the requested APK outcome without introducing unnecessary offline or sync complexity.

## Architecture

### Existing System

Qyzen is a Next.js App Router application with server-backed routes, Supabase integration, and authenticated dashboard flows. The web deployment remains the canonical runtime for application logic and data access.

### New Mobile Layer

Add Capacitor configuration to the existing repository and generate the Android platform project. The Android app becomes a packaging and runtime shell with these responsibilities:

- launch the production Qyzen site
- expose native app metadata and Android packaging
- handle WebView startup behavior
- present a simple offline-required fallback when startup fails without connectivity
- provide Android back-button behavior aligned with in-app navigation

### Deployment Model

The APK points to the production deployment only. The app does not maintain a separate staging target in this feature. Environment and config values must make the production URL explicit and easy to update later if needed.

## User Experience

### App Launch

When the user opens the Android app, Capacitor loads the Qyzen production URL. If the site loads successfully, the user interacts with the same application flows already available on the web.

### Offline Behavior

If the device is offline during initial launch, or the hosted app cannot be loaded, the user sees a simple offline-required screen. The screen should communicate that an internet connection is required to use Qyzen and offer an obvious retry action.

### Navigation Behavior

Android back should first navigate backward within the WebView history when meaningful history exists. If there is no useful web history to return to, the app should exit rather than trapping the user in a broken navigation loop.

## Technical Scope

### In Scope

- Capacitor installation and project configuration
- Android platform generation and sync setup
- App metadata updates needed for Android packaging
- Production URL configuration for the WebView host target
- Minimal offline-required handling for failed startup
- Back-button behavior needed for Android usability
- Documentation for how to sync, open Android Studio, and produce the APK

### Out Of Scope

- New product features unrelated to Android packaging
- Full offline caching and synchronization
- Native feature expansion beyond what is required for stable shell behavior
- Server-side architecture changes unrelated to mobile wrapping

## Codebase Impact

### Expected File Areas

Most changes should be limited to:

- project configuration and package metadata
- Capacitor config files
- generated Android platform files
- small web app adjustments only if needed to support shell startup or offline fallback
- feature documentation for build and release workflow

### Pattern Alignment

Implementation should follow existing repository conventions and keep mobile-specific logic isolated. Any web-side changes should be minimal, explicit, and directly tied to the hosted-app-in-native-shell requirement.

## Risks And Mitigations

### Hosted App Availability

Risk: the APK depends on the production deployment being reachable.  
Mitigation: present a clean offline-required screen with retry instead of leaving the user on a blank or failed load state.

### Authentication In WebView

Risk: authentication flows can behave differently inside mobile WebViews.  
Mitigation: preserve current hosted auth flow first, verify sign-in behavior during manual Android smoke testing, and avoid premature auth rewrites unless testing proves they are necessary.

### Navigation Mismatch

Risk: Android back can feel incorrect if it conflicts with web history.  
Mitigation: explicitly define back behavior around WebView history before app exit.

## Testing Strategy

### Automated Verification

- validate dependency and config changes with project checks already used in the repo
- verify the project still builds after Capacitor integration
- verify Android sync commands complete successfully

### Manual Smoke Testing

- install or run the Android app shell
- confirm startup opens the production Qyzen site
- confirm a reachable sign-in path
- confirm dashboard route navigation behaves normally
- confirm offline launch shows the offline-required state
- confirm retry recovers after connectivity returns
- confirm Android back navigates web history before exit

## Success Criteria

The feature is complete when:

- the repository can generate and sync an Android Capacitor project
- the Android app opens the production Qyzen deployment
- the app can be packaged into an installable APK
- offline startup failure is handled with a clear retryable message
- manual smoke testing confirms launch and navigation behavior are acceptable

## Implementation Notes For Planning

- Favor the smallest viable hosted-wrapper implementation
- Keep configuration explicit so the production host can be identified easily
- Avoid adding native plugins unless they directly support the approved scope
- Keep all follow-up work scoped to the requirements in `prompts/WebAppToAPK.md`
