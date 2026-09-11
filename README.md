# FISOP — Government Interoperability & Service Orchestration Platform

> **Existing portals digitize individual services; FISOP digitizes the coordination between those services.**

FISOP (Government Interoperability Platform) is a prototype platform designed to improve interoperability between government departments and provide citizens with a unified, transparent application experience.

Instead of replacing existing departmental systems, FISOP acts as an **interoperability and workflow orchestration layer** that connects authorized departmental services, resolves citizen identity, manages purpose-aware consent, coordinates multi-department workflows, handles service failures, and provides end-to-end application tracking.

---

## 📌 Problem Statement

Government services are often distributed across multiple departments and portals. A citizen may need to:

- Submit similar information multiple times
- Interact with different departmental systems
- Provide documents that may already exist with another department
- Manually track applications across different services
- Visit an office when a required record is unavailable
- Deal with delays caused by dependencies between departments

At the system level, departments may also use different:

- APIs
- Data formats
- Identifiers
- Authentication mechanisms
- Availability and response characteristics

This creates both **citizen-side friction** and **system-level interoperability challenges**.

---

## 💡 Proposed Solution

FISOP provides a common orchestration layer between citizens and participating government departments.

### Core Flow

```text
Citizen
   │
   ▼
Identity Resolution
   │
   ▼
Purpose-Aware Consent
   │
   ▼
Canonical Data Model
   │
   ▼
Department Connectors
   │
   ├──────────► Revenue
   ├──────────► Land
   ├──────────► Welfare
   └──────────► Other Departments
   │
   ▼
Workflow Orchestration
   │
   ▼
Decision / Verification
   │
   ▼
Notification & Application Tracking
````

FISOP does not attempt to become a replacement for every departmental database.

Instead:

> **We connect, rather than replace, existing departmental systems.**

---

# ✨ Key Features

## 1. Unified Citizen Application Experience

Citizens can:

* Apply for government services
* View submitted applications
* Track application progress
* View application timelines
* Receive decision notifications
* Understand why an application was rejected
* Reapply using previously submitted information

---

## 2. Identity Resolution

FISOP separates the citizen-facing identity from department-specific identifiers.

For example:

```text
Citizen
   │
   ├── Revenue ID
   ├── Land ID
   └── Welfare ID
```

An interoperability layer maps these identifiers into a common representation so that downstream workflows can interact with departmental systems consistently.

---

## 3. Purpose-Aware Consent

Interoperability does not mean unrestricted access to citizen data.

FISOP uses consent as part of the data exchange process.

A data request is associated with:

* Citizen identity
* Requested data
* Purpose
* Service/application
* Department
* Consent state

Conceptually:

```text
WHO       → Citizen
WHAT      → Required data
WHY       → Service purpose
WHO NEEDS → Authorized department
```

Data exchange is also recorded for auditability.

---

## 4. Canonical Data Model

Different departments may represent the same information using different field names or structures.

For example:

```text
Department A → citizen_id
Department B → applicant_id
Department C → beneficiary_id
```

FISOP introduces a canonical representation and connector-specific mappings.

This reduces coupling between the core platform and individual departmental implementations.

---

## 5. Department Connectors

Each department is integrated through a dedicated connector/adapter.

```text
FISOP Canonical Request
          │
          ▼
   Department Connector
          │
          ▼
Department-specific API
```

The connector is responsible for translating between FISOP's standard representation and the department's specific interface.

This makes departmental integrations independently maintainable.

---

## 6. Workflow Orchestration

FISOP coordinates multi-step processes across departments.

A workflow may look like:

```text
Application Submitted
        │
        ▼
Identity Verification
        │
        ▼
Consent Verification
        │
        ▼
Revenue Data Check
        │
        ▼
Land Data Check
        │
        ▼
Department Review
        │
        ▼
Decision
        │
        ▼
Citizen Notification
```

The workflow state is persisted so that an application can be tracked throughout its lifecycle.

---

## 7. Missing Document / Data Handling

A key feature of FISOP is handling situations where a required departmental record is not available.

Instead of simply failing the application:

```text
Required data unavailable
          │
          ▼
Application → WAITING
          │
          ├── Explain what is missing
          ├── Identify responsible department
          ├── Provide office/routing information
          └── Notify citizen
```

Once the departmental record becomes available, the workflow can be resumed and verification can be performed again.

### Citizen-Specific Availability

Availability is evaluated at the citizen/record level rather than using a global service-level switch.

Therefore:

```text
Citizen A → Revenue record found
Citizen B → Revenue record not found
```

The same service can therefore produce different outcomes depending on the actual underlying record.

---

## 8. Smart Reapplication

When an application is rejected, the citizen can see:

* Rejection reason
* Officer remarks
* Affected fields
* Previous application information

The citizen can then review and correct the information before submitting a **new application**.

The original rejected application remains preserved.

```text
Original Application
        │
        ▼
     REJECTED
        │
        ▼
Review & Reapply
        │
        ▼
   New Application
        │
        └── Linked to previous application
```

This maintains application history and traceability.

---

## 9. Reliability & Resilience

Government systems may have varying availability and performance characteristics.

FISOP therefore incorporates:

* Request timeouts
* Controlled retries
* Circuit breakers
* Rate limiting
* Waiting states
* Resume mechanisms
* Idempotent application submission

### Example

```text
FISOP
  │
  ▼
Connector
  │
  ├── Timeout → Retry
  │
  ├── Temporary failure → Retry
  │
  ├── Repeated failure → Circuit Breaker
  │
  └── Dependency unavailable → WAITING
```

The goal is to prevent a temporary downstream failure from becoming a lost citizen application.

---

## 10. Application Idempotency

Duplicate requests should not create duplicate applications.

FISOP uses an idempotency mechanism to ensure that repeated submissions with the same idempotency key can be safely handled.

This is especially important when clients retry requests because of network failures.

---

## 11. Role-Based Access Control

The platform separates access based on user role.

Example roles include:

```text
CITIZEN
DEPARTMENT_OFFICIAL
OPERATIONS
ADMIN
```

Citizens can access their own applications.

Officials can access applications relevant to their authorized department.

Administrative and operational functions are separately protected.

Authentication is integrated with **Keycloak / OpenID Connect (OIDC)** for the prototype.

---

## 12. Auditability

Important application and workflow actions are recorded through audit logging.

This supports:

* Traceability
* Accountability
* Debugging
* Operational investigation
* Compliance-oriented design

The objective is to answer:

> **Who performed the action, on which application, and when?**

---

## 13. Operational Monitoring

FISOP includes operational APIs and dashboards for monitoring:

* System health
* Workflow states
* Waiting workflows
* SLA information
* Data-quality indicators
* Exceptions
* Application timelines
* Operational metrics

This allows the platform to be viewed not only from the citizen perspective but also from the perspective of government operations.

---

# 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │      Citizens       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FISOP Frontend    │
                         │     React UI        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │  API + RBAC + Logic │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌────────────┐        ┌─────────────┐       ┌────────────┐
       │  Identity  │        │   Consent   │       │  Workflow  │
       │ Resolution │        │ Management  │       │Orchestrator│
       └────────────┘        └─────────────┘       └─────┬──────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │    Connectors   │
                                               └────────┬────────┘
                                                        │
                             ┌──────────────────────────┼──────────────────────┐
                             │                          │                      │
                             ▼                          ▼                      ▼
                      ┌────────────┐             ┌────────────┐        ┌────────────┐
                      │  Revenue   │             │    Land    │        │  Welfare   │
                      │ Department │             │ Department │        │ Department │
                      └────────────┘             └────────────┘        └────────────┘

                         ┌─────────────────────┐
                         │      Database       │
                         │    Persistence      │
                         └─────────────────────┘

                         ┌─────────────────────┐
                         │      Keycloak       │
                         │ Authentication/RBAC │
                         └─────────────────────┘
```

---

# 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* React Router
* Responsive Web UI
* Internationalization (English / Hindi / Marathi)

### Backend

* Python
* FastAPI
* REST APIs
* Pydantic
* Service-oriented backend architecture

### Authentication & Authorization

* Keycloak
* OpenID Connect (OIDC)
* JWT
* Role-Based Access Control (RBAC)

### Data & Persistence

* Relational database architecture
* SQLite for the current local prototype
* PostgreSQL/Supabase-compatible architecture for production-oriented deployment

### Workflow

* Camunda 8 workflow orchestration
* Stateful application/workflow tracking

### Reliability

* Timeouts
* Retries
* Circuit breakers
* Rate limiting
* Idempotency
* Waiting/resume workflow states

---

# 📂 Project Structure

```text
FISOP/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── connectors/
│   │   └── ...
│   │
│   ├── migrations/
│   ├── tests/
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── i18n/
│   │   └── ...
│   │
│   └── ...
│
├── README.md
└── ...
```

> Directory names may vary depending on the current repository structure.

---

# 🔐 Security Architecture

FISOP follows a layered security model:

```text
Authentication
      ↓
Authorization / RBAC
      ↓
Citizen Ownership / Department Scope
      ↓
Purpose-Aware Consent
      ↓
Controlled Connector Access
      ↓
Audit Logging
```

Key principles:

* Never expose departmental APIs directly to citizens
* Enforce authorization at API boundaries
* Restrict citizens to their own application data
* Restrict officials according to department/role
* Avoid unnecessary duplication of departmental data
* Record important operations for auditability
* Use controlled connector access to downstream systems

---

# 📊 Scalability Strategy

FISOP is designed around the principle that the interoperability layer and downstream departments have different scaling characteristics.

### FISOP-side scaling

* Horizontal backend scaling
* Multiple workflow workers
* Asynchronous processing
* Database indexing and optimization
* Controlled concurrency

### Department-side protection

* Per-connector rate limits
* Request timeouts
* Retry policies
* Circuit breakers
* Waiting states

Conceptually:

```text
                 ┌── Worker ── Revenue
FISOP Queue ─────┼── Worker ── Land
                 └── Worker ── Welfare
```

This allows FISOP to scale its own processing capacity without overwhelming slower or legacy departmental systems.

---

# 🧪 Testing

The prototype includes backend tests covering areas such as:

* Authentication and authorization
* Application submission
* Idempotency
* Consent
* Identity mapping
* Workflow transitions
* Department connector behavior
* Missing-document scenarios
* Citizen isolation
* Officer workflows
* Resume behavior
* Reapplication
* Notifications
* Operational APIs

Frontend production builds are also validated as part of the development workflow.

---

# 🚀 Running the Prototype

## Prerequisites

Install:

* Python 3.x
* Node.js / npm
* Docker Desktop
* Keycloak
* Camunda 8 dependencies used by the project

---

## Backend

From the backend directory:

```bash
pip install -r requirements.txt
```

Start the FastAPI application using the project's configured startup command.

The prototype backend is available at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

## Frontend

From the frontend directory:

```bash
npm install
npm run dev
```

The development frontend runs at:

```text
http://localhost:3000
```

---

## Authentication

The prototype uses Keycloak for authentication and role-based authorization.

Keycloak is typically available at:

```text
http://localhost:8080
```

---

# 👥 Prototype Roles

| Role                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| Citizen             | Apply for services and track own applications          |
| Department Official | Review and process department-specific cases           |
| Operations          | Monitor workflows, SLAs and exceptions                 |
| Admin               | Manage platform-level configuration and administration |

---

# 🧭 Example End-to-End Scenario

## Successful Case

```text
Citizen logs in
      ↓
Selects government service
      ↓
Provides consent
      ↓
FISOP resolves departmental identity
      ↓
Revenue record found
      ↓
Land/Welfare information retrieved
      ↓
Workflow continues
      ↓
Officer reviews
      ↓
Application approved
      ↓
Citizen receives notification
```

---

## Missing-Record Case

```text
Citizen logs in
      ↓
Selects government service
      ↓
Provides consent
      ↓
Revenue record requested
      ↓
Record not found
      ↓
Application → WAITING FOR DOCUMENT
      ↓
Citizen sees exactly what is missing
      ↓
Responsible office information displayed
      ↓
Citizen is notified
      ↓
Record becomes available
      ↓
Resume Verification
      ↓
Workflow continues
```

---

# 🎯 Why FISOP?

FISOP focuses on the **coordination layer** that is often missing between otherwise digitized government services.

The platform brings together:

* Identity resolution
* Consent management
* Canonical data exchange
* Department connectors
* Workflow orchestration
* Application tracking
* Resilience
* SLA monitoring
* Exception handling
* Auditability

into one interoperable architecture.

---

# 🌱 Future Scope

A production deployment would require additional work beyond the prototype.

## Government Integrations

* Authorized departmental APIs
* Integration agreements
* API specifications and versioning
* Government identity/information systems

## Security & Compliance

* Formal security audits
* Threat modelling
* Privacy impact assessments
* Production-grade secrets management
* Government compliance requirements

## Infrastructure

* PostgreSQL production deployment
* Distributed queues
* Container orchestration
* Horizontal scaling
* Centralized observability

## Citizen Communication

* Production SMS/Email integration
* Authorized WhatsApp or other communication channels
* Multilingual expansion
* Accessibility improvements

## Intelligence & Analytics

* Advanced data-quality validation
* Workflow optimization
* Analytics for departmental bottlenecks
* SLA prediction
* Operational insights

---

# ⚠️ Prototype Disclaimer

This repository represents a **prototype / proof-of-concept architecture**.

The departmental connectors and datasets used for demonstration are mock/simulated integrations and **do not represent live access to government databases or APIs**.

Production deployment would require:

* Authorization from relevant government departments
* Official API/integration access
* Validated data-sharing agreements
* Security and privacy assessments
* Compliance with applicable government policies and regulations

The purpose of this prototype is to demonstrate the **technical architecture, interoperability model, workflow orchestration and citizen experience**.

---

# 🏆 Project Context

FISOP was developed as a solution concept for the **Smart India Hackathon** problem space around government interoperability and coordinated citizen services.

The project focuses on demonstrating how existing government systems can be connected through a secure orchestration layer without requiring every department to replace its existing infrastructure.

---

# 📌 Core Design Principles

> **Connect, don't replace.**

> **Interoperability does not mean unrestricted data access.**

> **Every exchange should have identity, authorization, purpose and auditability.**

> **A downstream failure should not become a lost citizen application.**

> **The citizen should track one coordinated case instead of navigating multiple disconnected workflows.**

---

# 👨‍💻 Contributors

Built by the FISOP project team as a Smart India Hackathon prototype.

---

## ⭐ Closing

FISOP explores how interoperability, workflow orchestration and resilient system design can improve the delivery of multi-department government services.

**One citizen. One coordinated workflow. Multiple departments.**

```
```
