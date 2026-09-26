# Technical Specification: Errand App

## 1. Executive Summary & Core Stack
The goal of this application is to facilitate a friction-free "Commander and Runner" errand workflow. 

### Selected Tech Stack
- **Frontend:** TanStack (Router, Query, Form) inside a Capacitor Native Wrapper.
- **Backend:** Node.js + Express.js (REST API + Bearer JWT Authentication).
- **Database:** SQLite managed via Prisma ORM.
- **Mobile Build Toolchain:** Headless Android SDK / Gradle CLI (`sdkmanager`, `gradlew`, `adb`) — **Android Studio skipped**.
- **Offline Engine:** TanStack Query with local persistence (`@tanstack/react-query-persist-client`) & optimistic mutation queues.

---

## 2. System Architecture Diagram

```mermaid
graph TD
    subgraph Mobile Device (Capacitor Native Shell)
        UI[TanStack Frontend: Router, Query, Form]
        LS[(Local Storage / Cache)]
        MQ[Offline Mutation Queue]
    end

    subgraph Development & CLI Build Pipeline
        VS[VS Code Editor]
        CLI[Android CLI Tools / Gradle CLI]
        ADB[ADB USB Deployment]
    end

    subgraph Backend Server App
        API[Node.js + Express.js API]
        JWT[Bearer JWT Middleware]
        DB[(SQLite Database via Prisma)]
    end

    VS -->|Build Assets| UI
    CLI -->|Assemble APK| ADB
    ADB -->|Deploy Native Shell| Mobile Device

    UI <-->|Cache / State| LS
    UI -->|Offline Action| MQ
    MQ -->|Background Sync on Reconnect| API
    UI <===>|HTTP REST API + JWT| API
    API <---> DB