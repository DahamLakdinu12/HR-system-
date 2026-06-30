#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="$project_root/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file. Create it from .env.example." >&2
  exit 1
fi

sql_password="$(sed -n 's/^MSSQL_SA_PASSWORD=//p' "$env_file" | tail -1)"
workbook="${1:-$(sed -n 's/^HR_STAFF_WORKBOOK=//p' "$env_file" | tail -1)}"
conversion_workbook="${2:-$(sed -n 's/^SALARY_CONVERSION_WORKBOOK=//p' "$env_file" | tail -1)}"

if [[ -z "$sql_password" || -z "$workbook" || -z "$conversion_workbook" ]]; then
  echo "MSSQL_SA_PASSWORD, HR_STAFF_WORKBOOK, and SALARY_CONVERSION_WORKBOOK are required in .env." >&2
  exit 1
fi

if [[ ! -f "$workbook" ]]; then
  echo "Workbook not found: $workbook" >&2
  exit 1
fi

if [[ ! -f "$conversion_workbook" ]]; then
  echo "Salary conversion workbook not found: $conversion_workbook" >&2
  exit 1
fi

python3 -c "import openpyxl" 2>/dev/null || {
  echo "Install importer dependencies: python3 -m pip install -r database/scripts/requirements.txt" >&2
  exit 1
}

import_file="$(mktemp /tmp/hr_staff_employees.XXXXXX.tsv)"
conversion_file="$(mktemp /tmp/hr_staff_salary_conversions.XXXXXX.tsv)"
trap 'rm -f "$import_file" "$conversion_file"' EXIT

python3 "$project_root/database/scripts/import_hr_staff.py" "$workbook" "$import_file"
python3 "$project_root/database/scripts/import_salary_conversions.py" \
  "$conversion_workbook" "$conversion_file"
chmod 0644 "$import_file"
chmod 0644 "$conversion_file"

docker cp "$project_root/database/sql-scripts/hr-staff/001_hr_staff_database.sql" \
  hcm-sqlserver:/tmp/001_hr_staff_database.sql
docker cp "$import_file" hcm-sqlserver:/tmp/hr_staff_employees.tsv
docker cp "$conversion_file" hcm-sqlserver:/tmp/hr_staff_salary_conversions.tsv

docker exec hcm-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$sql_password" -C -d master -b \
  -i /tmp/001_hr_staff_database.sql

docker exec hcm-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$sql_password" -C -d HRStaff -b \
  -Q "BULK INSERT dbo.Employees FROM '/tmp/hr_staff_employees.tsv' WITH (FIELDTERMINATOR = '0x09', ROWTERMINATOR = '0x0a', KEEPNULLS, TABLOCK);"

docker exec hcm-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$sql_password" -C -d HRStaff \
  -Q "BULK INSERT dbo.SalaryConversionPoints FROM '/tmp/hr_staff_salary_conversions.tsv' WITH (FIELDTERMINATOR = '0x09', ROWTERMINATOR = '0x0a', KEEPNULLS, TABLOCK);"

docker exec hcm-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$sql_password" -C -d HRStaff \
  -Q "SELECT (SELECT COUNT(*) FROM dbo.Employees) AS ImportedEmployees, (SELECT COUNT(*) FROM dbo.SalaryConversionPoints) AS ImportedSalaryPoints;"
