# HR Increment Management System

Production-ready starter structure for an HR Increment Management System using React + Vite, ASP.NET Core Web API (.NET 10), Microsoft SQL Server, and Entity Framework Core.

## Frontend Quick Start

```bash
cd frontend
npm install
npm run dev
```

The frontend opens on the login screen. Submit the prefilled demo credentials to view the responsive HR dashboard, and use the profile control at the bottom of the sidebar to sign out.

## Backend Quick Start

The backend requires the .NET 10 SDK and SQL Server. Replace development placeholders with
environment variables described in `docs/deployment/configuration.md`, then run:

```bash
dotnet tool restore
dotnet restore HRIncrement.slnx
dotnet run --project backend/src/HRIncrement.Api
```

Generate or review the database script without applying it automatically:

```bash
dotnet tool run dotnet-ef migrations script \
  --project backend/src/HRIncrement.Infrastructure \
  --startup-project backend/src/HRIncrement.Api \
  --context ApplicationDbContext \
  --idempotent
```

The API validates tokens issued by the configured corporate identity provider. The frontend's
prefilled login remains a development-only UI flow until that provider is connected.

## Project Purpose

- Integrate with an existing HCM system.
- Retrieve employee information including Employee ID, Name, Designation, Grade, Department, Location, Appointment Date, Promotion Date, and Increment Date.
- Manage salary conversion using government gazette salary scales.
- Automatically calculate increments and payable salary.
- Generate Increment Assessment Forms as PDF documents.
- Support future modules such as leave integration, attendance integration, approval workflows, and audit logs.

## Folder Structure

```text
HR-system-/
├── frontend/
│   └── src/
│       ├── app/
│       ├── assets/
│       │   ├── icons/
│       │   ├── images/
│       │   └── styles/
│       ├── components/
│       │   ├── common/
│       │   ├── feedback/
│       │   ├── forms/
│       │   └── tables/
│       ├── context/
│       ├── features/
│       │   ├── assessment-forms/
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   ├── pages/
│       │   │   ├── services/
│       │   │   └── types/
│       │   ├── attendance-integration/
│       │   ├── audit-logs/
│       │   ├── approvals/
│       │   ├── employees/
│       │   ├── increments/
│       │   ├── leave-integration/
│       │   └── salary-scales/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       │   ├── api/
│       │   └── hcm/
│       ├── types/
│       └── utils/
├── backend/
│   ├── src/
│   │   ├── HRIncrement.Api/
│   │   │   ├── Authentication/
│   │   │   ├── Authorization/
│   │   │   ├── Configurations/
│   │   │   ├── Controllers/
│   │   │   ├── Extensions/
│   │   │   ├── Filters/
│   │   │   └── Middleware/
│   │   ├── HRIncrement.Application/
│   │   │   ├── DTOs/
│   │   │   ├── Features/
│   │   │   │   ├── AssessmentForms/
│   │   │   │   ├── Approvals/
│   │   │   │   ├── AuditLogs/
│   │   │   │   ├── Employees/
│   │   │   │   ├── HcmIntegration/
│   │   │   │   ├── Increments/
│   │   │   │   └── SalaryScales/
│   │   │   ├── Interfaces/
│   │   │   ├── Mappings/
│   │   │   ├── Services/
│   │   │   └── Validators/
│   │   ├── HRIncrement.Domain/
│   │   │   ├── Entities/
│   │   │   ├── Enums/
│   │   │   ├── Events/
│   │   │   ├── Exceptions/
│   │   │   ├── Rules/
│   │   │   └── ValueObjects/
│   │   ├── HRIncrement.Infrastructure/
│   │   │   ├── Authentication/
│   │   │   ├── Configurations/
│   │   │   ├── Data/
│   │   │   ├── HcmIntegration/
│   │   │   ├── Helpers/
│   │   │   ├── Logging/
│   │   │   ├── PdfGeneration/
│   │   │   ├── Repositories/
│   │   │   ├── SalaryCalculationEngine/
│   │   │   └── Services/
│   │   └── HRIncrement.Shared/
│   │       ├── Constants/
│   │       ├── Helpers/
│   │       └── Results/
│   └── tests/
│       ├── HRIncrement.ArchitectureTests/
│       ├── HRIncrement.IntegrationTests/
│       └── HRIncrement.UnitTests/
├── database/
│   ├── functions/
│   ├── migrations/
│   ├── seed-data/
│   ├── sql-scripts/
│   │   ├── indexes/
│   │   ├── schema/
│   │   └── views/
│   └── stored-procedures/
└── docs/
    ├── api/
    ├── architecture-diagrams/
    ├── business-rules/
    ├── deployment/
    ├── government-gazette-rules/
    ├── operations/
    └── security/
```

## Folder Purposes

### Frontend

- `frontend/src/app`: Application bootstrap, global providers, app-level configuration.
- `assets`: Images, icons, and global styles.
- `components`: Reusable UI components shared across features.
- `context`: React context providers for auth, user session, permissions, and app settings.
- `features`: Business modules grouped by HR capability. Each feature owns its components, pages, hooks, services, and types.
- `hooks`: Shared reusable React hooks.
- `layouts`: Shell layouts such as authenticated layout, admin layout, and print/PDF preview layout.
- `pages`: Route-level pages that are not tied to one feature.
- `routes`: Route definitions, route guards, and lazy loading setup.
- `services/api`: Shared HTTP client, interceptors, error handling, and API configuration.
- `services/hcm`: Frontend-facing HCM integration clients or adapters.
- `types`: Shared TypeScript interfaces and enums.
- `utils`: Formatting, validation helpers, date utilities, currency helpers, and permission utilities.

### Backend

- `HRIncrement.Api`: ASP.NET Core Web API entry point. Contains controllers, middleware, auth setup, filters, and API configuration.
- `HRIncrement.Application`: Use cases and business orchestration. Contains DTOs, validators, interfaces, mappings, application services, and feature-specific commands/queries.
- `HRIncrement.Domain`: Core business model. Contains entities, value objects, domain rules, events, enums, and domain exceptions.
- `HRIncrement.Infrastructure`: External implementation details. Contains EF Core DbContext, repositories, HCM integration clients, PDF generation, logging, SQL Server configuration, authentication implementations, and salary calculation engine implementations.
- `HRIncrement.Shared`: Cross-cutting primitives used safely across layers, such as constants, result wrappers, and simple helpers.
- `backend/tests`: Unit, integration, and architecture tests.

### Database

- `sql-scripts/schema`: SQL Server table, constraint, and relationship scripts.
- `sql-scripts/indexes`: Performance indexes for employee, increment, salary scale, and audit queries.
- `sql-scripts/views`: Reporting and read-model views.
- `migrations`: EF Core migration history or generated SQL migration scripts.
- `seed-data`: Initial lookup data such as grades, departments, salary scales, approval statuses, and roles.
- `stored-procedures`: Stored procedures reserved for reporting, legacy HCM sync, or approved performance-critical operations.
- `functions`: SQL scalar/table functions, for example salary-scale lookup helpers.

### Documentation

- `api`: OpenAPI notes, endpoint contracts, request/response examples.
- `architecture-diagrams`: System context, container, component, and deployment diagrams.
- `business-rules`: Increment eligibility, calculation, approval, and assessment rules.
- `government-gazette-rules`: Gazette references, salary scale versions, conversion formulas, and effective dates.
- `deployment`: Environment setup, CI/CD, release notes, and hosting instructions.
- `security`: Authentication, authorization, data privacy, role matrix, and audit policy.
- `operations`: Backups, monitoring, support runbooks, and incident procedures.

## Naming Conventions

- Use `PascalCase` for C# classes, records, enums, methods, and public properties.
- Use `camelCase` for TypeScript variables, functions, hooks, and object fields.
- Use `PascalCase` for React components and page components.
- Use `kebab-case` for frontend folder names and route paths.
- Use plural table names only if the organization already standardizes on them; otherwise choose one convention and keep it consistent.
- Use explicit suffixes: `Controller`, `Service`, `Repository`, `Dto`, `Request`, `Response`, `Validator`, `Configuration`, `Options`, `Policy`, `Provider`, `Generator`.
- Name business concepts using HR language, for example `IncrementAssessment`, `SalaryScale`, `GazetteRule`, `EmployeeIncrement`, and `PayableSalary`.

## Best Practices

- Keep domain rules in `HRIncrement.Domain` and application workflows in `HRIncrement.Application`.
- Keep database, PDF, HCM, email, file storage, and logging implementation details in `HRIncrement.Infrastructure`.
- Do not let controllers call repositories directly. Controllers should call application services or use cases.
- Version government gazette salary scales with effective dates and preserve historical calculations.
- Store all increment decisions, manual overrides, approvals, and generated document metadata in audit-friendly tables.
- Use idempotent HCM sync operations so repeated imports do not duplicate employees or increments.
- Use DTOs for API boundaries; do not expose EF Core entities directly from controllers.
- Add authorization policies for HR Admin, HR Officer, Approver, Auditor, and Read Only roles.
- Use correlation IDs and structured logging for every HCM sync, salary calculation, approval action, and PDF generation.
- Add architecture tests to enforce Clean Architecture dependencies.
- Generate PDFs from approved templates and store immutable PDF versions for finalized assessments.
- Keep future modules isolated under `features` on the frontend and `Features` in the application layer.
