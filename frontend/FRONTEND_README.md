# FISOP Frontend (Progressive Web Application)

Federated Interoperability and Service Orchestration Platform (FISOP) citizen and official web interface for **Smart India Hackathon (SIH) Problem Statement 26129** (Government of Maharashtra).

---

## 🛠 Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (Government Design System: deep blue `#0F3D6E` and neutral slate)
- **Data Fetching & Caching**: TanStack Query (`@tanstack/react-query`)
- **Routing**: React Router v6
- **OIDC Authentication**: `keycloak-js` (Official Keycloak adapter with PKCE)
- **PWA**: `vite-plugin-pwa` (Full Web App Manifest & Service Worker caching)
- **Icons**: `lucide-react`

---

## ⚙️ Environment Configuration

Create a `.env.local` file inside the `frontend/` directory (note: `.env.local` is git-ignored):

```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8000

# Keycloak OIDC Authentication Configuration
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=government-interoperability
VITE_KEYCLOAK_CLIENT_ID=interoperability-api

# Optional: Set to true in development mode only to show test credential hints
VITE_ENABLE_DEV_CREDENTIALS_HINT=true
```

### Required Environment Variable Names:
- `VITE_API_BASE_URL` — Base URL of the running FastAPI backend
- `VITE_KEYCLOAK_URL` — Base URL of the Keycloak server
- `VITE_KEYCLOAK_REALM` — Keycloak realm name (e.g. `government-interoperability`)
- `VITE_KEYCLOAK_CLIENT_ID` — Keycloak client identifier (e.g. `interoperability-api`)
- `VITE_ENABLE_DEV_CREDENTIALS_HINT` — (Optional) Boolean flag to show test account hints on the login page in development.

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 3. Type-Checking
```bash
npm run typecheck
```

### 4. Production Build
```bash
npm run build
```

---

## 🔐 Role-Based Access Control (RBAC)

The application extracts realm roles from Keycloak JWT tokens:

| Role | Access | Default Redirect |
|---|---|---|
| **CITIZEN** | Submit applications (`/apply`), view live status stepper (`/applications/:id/status`), view past applications (`/my-applications`) | `/my-applications` |
| **DEPARTMENT_OFFICIAL** | Official case queue (`/official/queue`), case detail & manual review (`/official/case/:id`), operations dashboard (`/official/operations`) | `/official/queue` |
| **ADMIN** | Full system access + AI Schema Governance (`/admin/ai-mappings`) & Canonical Schema Registry (`/admin/canonical-schema`) | `/official/queue` |

---

## 📱 PWA Features

- **Installable**: Meets PWA installation criteria across Chrome, Edge, and mobile browsers.
- **Offline Resilient**: Caches static app shells and displays an offline indicator when disconnected.
- **Mobile-First**: Fully responsive navigation and touch targets.
