# Otomos Development Roadmap

## Milestone 1: Core Foundation & Auth Engine
> **Goal:** Set up the repositories, base environments, database models, friction-free user onboarding, and core unit test suite.

- [ ] **M1.1 Backend Project Setup:** Initialize Express.js server with TypeScript, Prisma, and SQLite configuration.
- [ ] **M1.2 Frontend Project Setup:** Initialize Vite + TanStack Router project with Capacitor JS shell.
- [ ] **M1.3 Prisma Data Schema:** Define `User`, `Connection`, `Errand`, and `ErrandItem` models in `schema.prisma`.
- [ ] **M1.4 7-Character ID Utility:** Implement a collision-free 7-character string generator (`code7`) for new accounts.
- [ ] **M1.5 Auth API Endpoints:** Build `/api/auth/signup` and `/api/auth/login` endpoints issuing Bearer JWT tokens.
- [ ] **M1.6 Auth Frontend Views:** Create registration and login screens in TanStack Form storing JWT in local storage.
- [ ] **M1.7 Unit Testing Setup:** Configure Vitest to validate `code7` generator functions and password hashing logic.

---

## Milestone 2: Connection & Social Graph Engine
> **Goal:** Allow users to search and link up with friends using their 7-character IDs with automated route integration tests.

- [ ] **M2.1 Connection API Endpoints:** Build `POST /api/connections` (request link via `code7`) and `GET /api/connections` routes.
- [ ] **M2.2 API Route Integration Tests:** Write Supertest integration tests for authentication and connection creation logic.
- [ ] **M2.3 Search & Request UI:** Build a mobile-friendly search bar to input a friend's `code7` and dispatch a link request.
- [ ] **M2.4 Friends List View:** Display active connections with quick action buttons to dispatch an errand or assign a mission.

---

## Milestone 3: Core Errand Workflow & Checklist UI (Online Phase)
> **Goal:** Enable the end-to-end Commander-Runner errand loop operating with active network connectivity.

- [ ] **M3.1 Errand Creation API:** Build `POST /api/errands` endpoint to accept an array of items assigned to a target `runnerId`.
- [ ] **M3.2 Commander UI (List Builder):** Dynamic form using TanStack Form to build dynamic shopping item lists and pick a runner.
- [ ] **M3.3 Runner UI (Invitation Modal):** Screen displaying pending errand requests with "Accept" or "Reject" buttons (`PATCH /api/errands/:id/status`).
- [ ] **M3.4 Interactive Checklist UI:** Active shopping screen for Runners to check off items (`PATCH /api/errands/:id/items/:itemId`).
- [ ] **M3.5 Delivery & Verification Flow:** "Mark Errand Done" flow for Runners and a final verification review screen for Commanders.
- [ ] **M3.6 State Machine Validation Unit Tests:** Write Vitest unit tests to ensure invalid state transitions (e.g., closing a rejected errand) are rejected.

---

## Milestone 4: Offline Capabilities & Sync Strategy
> **Goal:** Keep the item checklist fully functional in dead zones without breaking UI state or losing item progress.

- [ ] **M4.1 Query Cache Persistence:** Configure `@tanstack/react-query-persist-client` backed by IndexedDB/LocalForage.
- [ ] **M4.2 Optimistic Item Check-offs:** Implement optimistic UI mutations so checking off an item instantly updates the UI off-grid (<100ms).
- [ ] **M4.3 Offline Mutation Queue:** Store failed network updates in a serialized local storage queue during internet dropouts.
- [ ] **M4.4 Reconnection Sync Listener:** Add `window.addEventListener('online')` background queue flusher to push pending mutations to Express.
- [ ] **M4.5 Offline Sync Integration Tests:** Mock Service Worker (MSW) tests for TanStack Query persistence and mutation queue flushing.

---

## Milestone 5: Capacitor Integration & Android CLI Pipeline
> **Goal:** Package the frontend web application into a native mobile APK using the headless Linux command-line toolchain.

- [ ] **M5.1 Capacitor Android Setup:** Add native platform shell (`npx cap add android`) and configure Vite relative paths (`base: './'`).
- [ ] **M5.2 Linux CLI Environment Validation:** Configure local Android Command Line Tools (`sdkmanager`, `adb`, `ANDROID_HOME` paths).
- [ ] **M5.3 APK Build Scripting:** Test headless Gradle compilation (`./gradlew assembleDebug`) from terminal.
- [ ] **M5.4 Physical Device USB Testing:** Deploy APKs onto a connected physical Android device (`npx cap run android` / `adb install`).
- [ ] **M5.5 Terminal Log Streaming:** Monitor native logs and web console outputs via `adb logcat`.

---

## Milestone 6: Polishing, Native Adjustments & Release Prep
> **Goal:** Fine-tune native app performance, branding, and package release binaries.

- [ ] **M6.1 App Branding:** Add custom **Otomos** app icons, splash screens, and native package identifiers.
- [ ] **M6.2 Native UX Polish:** Add pull-to-refresh gestures and haptic feedback on checklist item interactions.
- [ ] **M6.3 Physical Device Airplane Mode Smoke Test:** Execute manual verification script for offline item toggling on physical phone over ADB.
- [ ] **M6.4 Signed Release Build:** Generate signed release APK/AAB bundle using Gradle CLI for standalone installation.