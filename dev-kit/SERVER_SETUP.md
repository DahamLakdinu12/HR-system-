# Server Setup Guide

This guide is for running the HR System on an internal server where Microsoft
SQL Server is already installed.

## 1. Server Prerequisites

- Microsoft SQL Server 2019 or newer.
- .NET 10 Hosting Bundle or .NET 10 runtime for the API server.
- IIS, Nginx, Apache, or another static file server for the React build.
- Node.js is required only on the build machine, not on the production server.

## 2. Databases

Create or restore these databases on the server SQL instance:

- `HRStaff`
- `HRIncrement`

`HRStaff` stores the approved HR employee list and salary conversion data.
`HRIncrement` stores application workflow data such as increments, approvals,
salary scales, workflow decisions, and gazette records.

For first-time setup, import the approved Excel data into `HRStaff` from a
trusted admin machine:

```bash
HR_DB_HOST=SERVER_NAME_OR_IP HR_DB_PORT=1433 HR_DB_USER=sa HR_DB_PASSWORD='password' \
dev-kit/scripts/import-hr-staff.sh
```

If IT does not use the `sa` login, use a SQL login that can recreate and seed
the `HRStaff` database during import.

## 3. Backend Configuration

Set backend settings using environment variables or the server secret manager.
Do not put production passwords in `appsettings.json`.

```text
ConnectionStrings__ApplicationDatabase=Server=SERVER_NAME;Database=HRIncrement;User Id=APP_USER;Password=PASSWORD;Encrypt=True;TrustServerCertificate=True
ConnectionStrings__HrStaffDatabase=Server=SERVER_NAME;Database=HRStaff;User Id=APP_USER;Password=PASSWORD;Encrypt=True;TrustServerCertificate=True;ApplicationIntent=ReadOnly
Cors__AllowedOrigins__0=https://hr.company.local
QuestPdf__License=Community_or_Commercial
```

Optional leave API:

```text
HcmLeaveApi__BaseUrl=https://hcm.company.local
HcmLeaveApi__ApiKey=API_KEY_FROM_IT
```

## 4. Frontend Configuration

Create the frontend environment file before building:

```bash
cp dev-kit/env/frontend.env.local.template frontend/.env.local
```

For server builds, set:

```text
VITE_API_BASE_URL=https://hr-api.company.local/api/v1
```

Then build:

```bash
dev-kit/scripts/build-all.sh
```

Deploy `artifacts/frontend-dist/` to the static web server.

## 5. Backend Deployment

Build the backend:

```bash
dev-kit/scripts/build-all.sh
```

Deploy `artifacts/backend-publish/` to IIS, systemd, a Windows Service, or the
company's preferred hosting method.

The API health check is:

```text
GET /health
```

## 6. Production Checklist

- Confirm both connection strings point to the server SQL instance.
- Confirm `HRStaff.dbo.Employees` contains the approved employee list.
- Confirm `HRStaff.dbo.SalaryConversionPoints` contains salary table data.
- Confirm `HRIncrement` migrations have run.
- Confirm the frontend can call the backend URL.
- Confirm PDF generation works from the Increment page preview.
- Confirm backups are enabled for `HRStaff` and `HRIncrement`.
