# FISOP Hackathon Demo Citizen Credentials

This document contains the deterministic **Demo Citizen Credentials** for the SIH 2026 prototype evaluation.
All authentication is **database-driven** against Supabase PostgreSQL.

---

## Demo Citizens (10 Authenticated Users)

| Demo Citizen | Name | Mobile Number | Citizen ID | Demo OTP | Seeded Applications | Expected Dashboard Experience |
|---|---|---|---|---|---|---|
| **Citizen 1** | Ramesh Kumar | `9876000001` | `CIT-000001` | `100001` | 1 Application | Higher Education Scholarship |
| **Citizen 2** | Priya Sharma | `9876000002` | `CIT-000002` | `100002` | 2 Applications | Income Certificate & Scholarship |
| **Citizen 3** | Amit Patel | `9876000003` | `CIT-000003` | `100003` | 0 Applications | **"No active applications"** (Empty State) |
| **Citizen 4** | Sunita Deshmukh | `9876000004` | `CIT-000004` | `100004` | 1 Application | Land Title Mutation |
| **Citizen 5** | Rajesh Verma | `9876000005` | `CIT-000005` | `100005` | 2 Applications | Disability Pension & Housing |
| **Citizen 6** | Ananya Joshi | `9876000006` | `CIT-000006` | `100006` | 1 Application | Higher Education Scholarship |
| **Citizen 7** | Vikram Singh | `9876000007` | `CIT-000007` | `100007` | 0 Applications | **"No active applications"** (Empty State) |
| **Citizen 8** | Meera Kulkarni | `9876000008` | `CIT-000008` | `100008` | 3 Applications | Income, Scholarship & Welfare |
| **Citizen 9** | Sanjay Pawar | `9876000009` | `CIT-000009` | `100009` | 1 Application | Housing Scheme |
| **Citizen 10** | Kavita Reddy | `9876000010` | `CIT-000010` | `100010` | 2 Applications | Scholarship & Land Title |

---

---

## Keycloak Demo Official Credentials (3 Department Officials)

| Department | Username | Password | Realm Role | department_code | Expected Official View |
|---|---|---|---|---|---|
| **Revenue Department** | `official_rev_01` | `FISOP@Rev2026!` | `DEPARTMENT_OFFICIAL` | `REV` | Revenue & Financial Verification Queue (Income Certificates, Solvency, Tax Clearances) |
| **Land Records Department** | `official_land_01` | `FISOP@Land2026!` | `DEPARTMENT_OFFICIAL` | `LAND` | Land Records & Settlement Queue (7/12 Title Mutation, Property Surveys, Encumbrances) |
| **Social Welfare Department** | `official_welf_01` | `FISOP@Welf2026!` | `DEPARTMENT_OFFICIAL` | `WELF` | Social Welfare & Pension Queue (Scholarships, DBT Grants, Disability Pensions) |

---

## Verification & Testing Flows

### 1. Citizen Portal Testing Flow
1. Open **[http://localhost:3000/access](http://localhost:3000/access)**
2. Click **Continue as Citizen**
3. Select **Continue with Mobile OTP**
4. Enter any demo mobile number (e.g. `9876000002` for Priya Sharma or `9876000003` for Amit Patel)
5. Click **Send OTP**
6. Enter the corresponding demo OTP (e.g. `100002` or `100003`) and click **Verify & Sign In**
7. The portal communicates with FastAPI backend `POST /api/auth/citizen/verify-otp`, authenticates against database, issues a signed JWT token, and loads ONLY that citizen's personalized dashboard data.

### 2. Department Official Real Keycloak SSO Testing Flow
1. Open **[http://localhost:3000/access](http://localhost:3000/access)**
2. Click **Government Official**
3. Click any department button (e.g. **Revenue Official**, **Land Records Official**, or **Social Welfare Official**) or **Continue with Keycloak SSO**
4. The user is redirected to the real Keycloak OIDC login screen at `http://localhost:8080`
5. Enter credentials:
   - For Revenue: `official_rev_01` / `FISOP@Rev2026!`
   - For Land: `official_land_01` / `FISOP@Land2026!`
   - For Welfare: `official_welf_01` / `FISOP@Welf2026!`
6. Submit credentials. Keycloak issues the OIDC token with `role: DEPARTMENT_OFFICIAL` and `department_code: REV / LAND / WELF` (without citizen ID) and redirects back to FISOP
7. FISOP validates the Keycloak token and displays the department-specific queue, metrics, and case management dashboard.
