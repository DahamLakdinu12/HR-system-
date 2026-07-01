# Initial API

All business endpoints require a validated bearer access token and permission claim.

| Method | Route | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Liveness response |
| `GET` | `/api/v1/employees/{employeeNumber}` | `employees.read` | Read employee from HCM |
| `GET` | `/api/v1/employees/due-increments` | `employees.read` | Paginated due employees |
| `POST` | `/api/v1/increments/calculate` | `increments.process` | Preview deterministic calculation |
| `POST` | `/api/v1/increments/assessment-form` | `increments.process` | Generate PDF form |
| `GET` | `/api/v1/reports/monthly-summary` | `increments.process` | Read monthly report totals |
| `GET` | `/api/v1/reports/increment-register` | `increments.process` | Download monthly increment table PDF |
| `GET` | `/api/v1/reports/monthly-approvals` | `increments.process` | Download accepted and declined approval PDF |

Development OpenAPI metadata is available at `/openapi/v1.json`.
