# HR System Development Kit

This development kit gives a new developer or IT engineer the shortest path to
run, build, and package the HR Increment Management System.

## What This Kit Contains

- `scripts/check-prerequisites.sh` checks the required tools.
- `scripts/install-dependencies.sh` restores backend and frontend packages.
- `scripts/start-local-sql.sh` starts the local SQL Server container for development.
- `scripts/import-hr-staff.sh` refreshes the `HRStaff` database from Excel files.
- `scripts/run-backend.sh` starts the ASP.NET Core API.
- `scripts/run-frontend.sh` starts the React/Vite frontend.
- `scripts/build-all.sh` builds the frontend and publishes the backend.
- `scripts/package-release.sh` creates a deployable release folder under `artifacts/`.
- `env/` contains safe environment templates.
- `SERVER_SETUP.md` explains how IT can deploy this on a server with MSSQL.

## Quick Start On A Developer Machine

From the project root:

```bash
dev-kit/scripts/check-prerequisites.sh
dev-kit/scripts/install-dependencies.sh
cp .env.example .env
```

Edit `.env` and set:

```dotenv
MSSQL_SA_PASSWORD=your-local-sql-password
HR_STAFF_WORKBOOK=/absolute/path/to/approved-hr-staff.xlsx
SALARY_CONVERSION_WORKBOOK=/absolute/path/to/salary-conversion-table.xlsx
```

Then run:

```bash
dev-kit/scripts/start-local-sql.sh
dev-kit/scripts/import-hr-staff.sh
dev-kit/scripts/run-backend.sh
```

Open a second Terminal and run:

```bash
dev-kit/scripts/run-frontend.sh
```

Frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:5180
```

## Build A Release Package

```bash
dev-kit/scripts/package-release.sh
```

Output:

```text
artifacts/hr-system-release/
```

That folder contains the backend publish output, frontend production build, and
server setup notes.

## Important Database Note

The running system uses:

- `HRStaff` for employee and salary conversion data.
- `HRIncrement` for increment workflow, approvals, salary scales, and generated
  assessment state.

The old HCM database is not used by the active employee pages anymore. The only
optional external HCM integration is the leave particulars API used by generated
PDFs.
