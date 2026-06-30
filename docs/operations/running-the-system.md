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

The API runs at:

```text
http://localhost:5180
```

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
