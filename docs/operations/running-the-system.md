# Running the HR Increment System

This guide explains how to open the system with the approved `HRStaff` SQL
database as the only employee data source.

## Prerequisites

- Docker Desktop is installed and running.
- .NET 10 SDK is installed.
- Node.js and npm are installed.
- The project root contains a local `.env` file with:

```dotenv
MSSQL_SA_PASSWORD=your-local-sql-password
HR_STAFF_WORKBOOK=/absolute/path/to/approved-hr-staff.xlsx
SALARY_CONVERSION_WORKBOOK=/absolute/path/to/salary-conversion-table.xlsx
```

The `.env` file and workbook files are excluded from Git.

## Start The System

Open Docker Desktop, then open three Terminal windows.

### 1. Start SQL Server

From the project root:

```bash
cd "/Users/sandungunawardana/Downloads/My Projects/HR-system-"
docker compose up -d
```

Confirm that SQL Server is healthy:

```bash
docker compose ps
```

The `hr-sqlserver` status should show `healthy`.

### 2. Import Or Refresh HR Staff Data

Install the importer dependency once:

```bash
python3 -m pip install -r database/scripts/requirements.txt
```

After updating `HR_STAFF_WORKBOOK` and `SALARY_CONVERSION_WORKBOOK` in `.env`,
rebuild the `HRStaff` database:

```bash
database/scripts/import_hr_staff.sh
```

This recreates the `HRStaff` employee table, salary conversion points, and API
view used by the backend.

### 3. Start The Backend API

From the project root:

```bash
dotnet run --project backend/src/HRIncrement.Api --launch-profile http
```

The API runs at:

```text
http://localhost:5180
```

Verify it in another Terminal:

```bash
curl http://localhost:5180/health
curl "http://localhost:5180/api/v1/employees?page=1&pageSize=5"
```

### 4. Start The React Frontend

From the frontend directory:

```bash
cd "/Users/sandungunawardana/Downloads/My Projects/HR-system-/frontend"
npm run dev
```

Open the application:

```text
http://localhost:5173
```

The dashboard, employees, departments, increment queue, reports, and generated
assessment PDFs now use the `HRStaff` database only.

## Optional External Leave API

Generated assessment PDFs can call an external HCM leave API for the
“Particulars of leave during the period” table. Configure these values through
environment variables or server secrets:

```bash
export HcmLeaveApi__BaseUrl="https://hcm.company.lk"
export HcmLeaveApi__ApiKey="API_KEY_FROM_IT"
```

If the leave API is not configured or unavailable, the PDF keeps the dotted
placeholders in the leave table.

## Stop The System

Stop the frontend and backend with `Ctrl+C` in their Terminal windows.

Stop SQL Server without deleting its database volume:

```bash
docker compose stop
```

Do not run `docker compose down --volumes` unless the local `HRStaff` and
`HRIncrement` database files should be deleted.

## Troubleshooting

### SQL Server Is Not Healthy

```bash
docker compose ps
docker logs hr-sqlserver
```

### Confirm Databases

```bash
docker exec hr-sqlserver /bin/bash -c \
  '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P "$MSSQL_SA_PASSWORD" -C \
  -Q "SELECT name, state_desc FROM sys.databases WHERE name IN ('\''HRStaff'\'','\''HRIncrement'\'')"'
```

### Employee Page Cannot Load Data

Confirm the API is running:

```bash
curl http://localhost:5180/health
```

Then confirm `HRStaff` was imported:

```bash
docker exec hr-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d HRStaff \
  -Q "SELECT COUNT(*) AS Employees FROM dbo.Employees"
```
