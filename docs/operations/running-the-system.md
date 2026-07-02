# Running the HR Increment System

This guide explains how to open the system after the HCM database has been
restored into the persistent Docker volume.

## Prerequisites

- Docker Desktop is installed and running.
- .NET 10 SDK is installed.
- Node.js and npm are installed.
- The project root contains a local `.env` file with:

```dotenv
MSSQL_SA_PASSWORD=your-local-sql-password
HCM_BACKUP_DIR=/absolute/path/to/HCM
```

The `.env` file and HCM backup are excluded from Git.

The approved HR workbook path is also configured in `.env`:

```dotenv
HR_STAFF_WORKBOOK=/absolute/path/to/approved-hr-staff.xlsx
SALARY_CONVERSION_WORKBOOK=/absolute/path/to/salary-conversion-table.xlsx
```

## Start the System

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

The `hcm-sqlserver` status should show `healthy`. The restored `HCM8`
database remains in the `hcm-sql-data` Docker volume, so it does not need to
be restored during normal startup.

### 2. Start the Backend API

From the project root:

```bash
dotnet run --project backend/src/HRIncrement.Api --launch-profile http
```

The local `HRIncrement` workflow database has already been migrated. After
pulling a future migration, apply it before starting the API:

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet tool run dotnet-ef database update \
  --project backend/src/HRIncrement.Infrastructure \
  --startup-project backend/src/HRIncrement.Api \
  --context ApplicationDbContext
```

The API runs at:

```text
http://localhost:5180
```

Development uses QuestPDF's `Evaluation` license declaration. Before a
production deployment, set `QuestPdf:License` to the license tier approved for
the organization; do not deploy with the evaluation setting.

Verify it in another Terminal:

```bash
curl http://localhost:5180/health
curl "http://localhost:5180/api/v1/employees?page=1&pageSize=5"
```

### 3. Start the React Frontend

From the frontend directory:

```bash
cd "/Users/sandungunawardana/Downloads/My Projects/HR-system-/frontend"
npm run dev
```

Open the application:

```text
http://localhost:5173
```

Use the **Data source** selector in the top bar to choose:

- **HR staff database**: the approved HR spreadsheet imported into `HRStaff`.
- **HCM database**: live records from the restored vendor `HCM8` database.

The selection is saved in the browser and applies to the dashboard, employees,
departments, increment queues, and generated assessment data.

## Workspace Settings

Open **Settings** from the sidebar to configure organization, increment,
notification, employee source, and display preferences. Select **Save settings**
to keep the choices in the current browser. **Restore defaults** removes those
saved preferences.

These preferences are currently workstation-specific and stored in browser
local storage. They do not change SQL Server connection strings, authentication,
gazette rules, or server configuration. The selected employee data source is
shared with the selector in the top navigation.

## Reimport the Approved HR Workbook

Install the importer dependency once:

```bash
python3 -m pip install -r database/scripts/requirements.txt
```

After updating `HR_STAFF_WORKBOOK` in `.env`, rebuild the `HRStaff` database:

```bash
database/scripts/import_hr_staff.sh
```

This recreates the `HRStaff` employee table, salary conversion points, and API
view. The importer assigns each conversion worksheet to its approved employee
grade code, then calculates the next salary point, converted 2026 salary, and
2026 payable salary. It does not modify either workbook or the `HCM8` database.

Employees whose current salary is above the final point in the assigned table
are marked for stagnation allowance review; the system does not invent a
conversion value for those records.

## Confirm Live HCM Data

Open the Employees page and search by pay code. When the API is available,
the page reads employee records through this flow:

```text
React -> ASP.NET Core API -> SQL Server HCM8
```

If the page says it is showing exported HCM records, the backend API is not
available and the frontend has switched to its static PSV fallback.

## Stop the System

Stop the frontend and backend with `Ctrl+C` in their Terminal windows.

Stop SQL Server without deleting its database volume:

```bash
docker compose stop
```

Do not run `docker compose down --volumes` unless the restored `HCM8`
database should be deleted.

## Troubleshooting

### SQL Server is not healthy

```bash
docker compose ps
docker logs hcm-sqlserver
```

### Backend cannot connect to HCM8

Confirm that SQL Server is healthy and that port `1433` is available:

```bash
docker compose ps
docker exec hcm-sqlserver /bin/bash -c \
  '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P "$MSSQL_SA_PASSWORD" -C \
  -Q "SELECT name, state_desc FROM sys.databases WHERE name = '\''HCM8'\''"'
```

### Employee page uses fallback data

Confirm the API is running:

```bash
curl http://localhost:5180/health
```

Then restart the frontend development server.
