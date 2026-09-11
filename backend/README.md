# Government Digital Interoperability Platform - Database Layer

This directory contains the complete database layer for the central **Government Digital Interoperability Platform**, built with **SQLAlchemy 2.x**, **Alembic**, and **psycopg3** targeting **Supabase PostgreSQL**.

---

## 🏛 Architecture Overview

The interoperability platform connects siloed departmental systems (Revenue, Land Records, Higher Education, Social Welfare, Housing) without altering their internal data schemas.

### Role of Supabase PostgreSQL
- **Hosted PostgreSQL**: Supabase hosts the central PostgreSQL instance used by the interoperability platform.
- **Canonical Citizen Identity**: Stores canonical citizen records (`CIT-xxxxxx`) and maps them to department-specific legacy IDs.
- **Consent Registry**: Manages citizen data access consents between departments.
- **Audit & Compliance**: Stores tamper-evident, payload-free metadata logs of all data exchange operations.

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py       # Engine, SessionLocal, Pydantic settings configuration
│   │   ├── base.py           # DeclarativeBase & Timezone Timestamp Mixin
│   │   └── models/           # SQLAlchemy 2.x ORM models
│   │       ├── __init__.py
│   │       ├── citizen.py
│   │       ├── department.py
│   │       ├── application.py
│   │       ├── consent.py
│   │       ├── identity_mapping.py
│   │       ├── workflow_instance.py
│   │       ├── audit_log.py
│   │       └── notification.py
│   │
│   ├── schemas/              # Pydantic v2 schemas
│   └── repositories/         # Generic CRUD repository layer
│
├── alembic/                  # Alembic migration environment
│   ├── versions/             # Database migration scripts
│   ├── env.py
│   └── script.py.mako
│
├── tests/
│   └── test_database.py      # Pytest database test suite
│
├── seed/
│   └── seed_database.py      # Idempotent synthetic data generator
│
├── requirements.txt          # Production and test python dependencies
├── alembic.ini               # Alembic configuration file
├── .env.example              # Template for environment variables
└── README.md
```

---

## ⚙️ Environment & Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure `DATABASE_URL` in `.env`:
   ```ini
   DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@db.YOUR_SUPABASE_REF.supabase.co:5432/postgres
   ```
   > ⚠️ **Note**: Ensure the driver prefix is `postgresql+psycopg://`.

---

## 🚀 Setup & Execution Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Database Migrations
To create all tables in your Supabase PostgreSQL instance:
```bash
alembic upgrade head
```

### 3. Seed Synthetic Data
To populate 100 synthetic citizens, 5 government departments, identity mappings, applications, consents, workflows, audit logs, and notifications:
```bash
python seed/seed_database.py
```

### 4. Run Unit Tests
To execute database tests with transaction rollback isolation:
```bash
pytest tests/test_database.py
```

---

## 🔍 How to Inspect Tables in Supabase

1. Log into your [Supabase Dashboard](https://app.supabase.com).
2. Select your project and navigate to the **Table Editor** or **SQL Editor**.
3. View tables:
   - `citizens`
   - `departments`
   - `applications`
   - `consents`
   - `identity_mappings`
   - `workflow_instances`
   - `audit_logs`
   - `notifications`

---

## 🔄 Creating Future Migrations

When modifying or adding SQLAlchemy models:

1. Generate a new migration script:
   ```bash
   alembic revision --autogenerate -m "describe_your_changes"
   ```

2. Inspect the newly created script under `alembic/versions/`.

3. Apply migration to Supabase:
   ```bash
   alembic upgrade head
   ```

---

## 🔒 Security & Data Hygiene Rules

1. **No Real PII**: Only synthetic data generated via Faker/Seed scripts is permitted.
2. **Audit Privacy**: Audit logs (`audit_logs`) NEVER store sensitive record payloads—only operation metadata (`actor_id`, `department_id`, `action`, `resource_id`, `trace_id`).
3. **No Hardcoded Credentials**: Database connection strings MUST be provided exclusively through environment variables (`DATABASE_URL`). `.env` is ignored by Git.
