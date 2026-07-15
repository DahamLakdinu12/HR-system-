using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using HRIncrement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HrStaffEmployeeReader(
    HrStaffDbContext hrStaffDbContext,
    IEmployeeHistoryService historyService,
    TimeProvider timeProvider) : IEmployeeReader
{
    public async Task<EmployeeSearchResultDto> SearchAsync(
        EmployeeDataSource dataSource,
        string? search,
        string? payCode,
        string? department,
        string? sortBy,
        string? sortDirection,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = Rows();
        if (!string.IsNullOrWhiteSpace(payCode))
        {
            var payCodeTerm = payCode.Trim();
            query = query.Where(x => x.PayCode.Contains(payCodeTerm));
        }

        if (!string.IsNullOrWhiteSpace(department))
        {
            var departmentTerm = department.Trim();
            query = departmentTerm == "Unassigned"
                ? query.Where(x => x.Department == string.Empty)
                : query.Where(x => x.Department == departmentTerm);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.EmployeeNumber.Contains(term) ||
                x.PayCode.Contains(term) ||
                x.FullName.Contains(term) ||
                x.Designation.Contains(term) ||
                x.Grade.Contains(term) ||
                x.Department.Contains(term) ||
                x.Location.Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        query = ApplySorting(query, sortBy, sortDirection);

        var items = await Project(query
            .Skip((page - 1) * pageSize)
            .Take(pageSize))
            .ToListAsync(cancellationToken);

        return new EmployeeSearchResultDto(items, page, pageSize, totalCount);
    }

    public Task<EmployeeDto?> GetByEmployeeNumberAsync(
        EmployeeDataSource dataSource,
        string employeeNumber,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        return Project(Rows().Where(x => x.EmployeeNumber == employeeNumber))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<EmployeeDto> UpdateHrStaffEmployeeAsync(
        string employeeNumber,
        UpdateHrStaffEmployeeRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        if (request.AppointmentDate == default)
            throw new InvalidOperationException("Appointment date is required.");
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new InvalidOperationException("Employee name is required.");
        if (string.IsNullOrWhiteSpace(request.Designation))
            throw new InvalidOperationException("Designation is required.");
        if (string.IsNullOrWhiteSpace(request.Grade))
            throw new InvalidOperationException("Grade is required.");
        if (request.CurrentSalary <= 0)
            throw new InvalidOperationException("Current salary must be greater than zero.");

        var before = await GetByEmployeeNumberAsync(
            EmployeeDataSource.HrStaff,
            employeeNumber,
            cancellationToken) ?? throw new KeyNotFoundException("Employee record not found in the HR staff database.");

        var (firstName, lastName) = SplitFullName(request.FullName);
        decimal? basicSalary2027 = request.BasicSalary2027 > 0 ? request.BasicSalary2027 : null;
        decimal? stagnationAllowance = request.StagnationAllowance > 0 ? request.StagnationAllowance : null;
        var salaryPoint = request.SalaryPoint ?? 0;

        var affected = await hrStaffDbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE dbo.Employees
            SET FirstName = {firstName},
                LastName = {lastName},
                PostDescription = {request.Designation.Trim()},
                NewGrade = {request.Grade.Trim()},
                Department = {(request.Department ?? string.Empty).Trim()},
                WorkLocation = {(request.Location ?? string.Empty).Trim()},
                SalaryScale = {NullIfWhiteSpace(request.SalaryScale)},
                DateJoined = {request.AppointmentDate},
                DateOfPromotion = {request.PromotionDate},
                NextIncrementDate = {request.NextIncrementDate},
                PayableSalary2026 = {request.CurrentSalary},
                BasicSalary2027 = {basicSalary2027},
                IncrementAmount = {request.IncrementAmount},
                StagnationAllowance = {stagnationAllowance},
                IncrementLevel = {salaryPoint},
                SalaryPoint = {salaryPoint}
            WHERE PayCode = {employeeNumber.Trim()}
            """, cancellationToken);

        if (affected != 1)
            throw new KeyNotFoundException("Employee record not found in the HR staff database.");

        var updated = await GetByEmployeeNumberAsync(EmployeeDataSource.HrStaff, employeeNumber, cancellationToken)
            ?? throw new KeyNotFoundException("Employee record could not be reloaded after update.");
        TrackEmployeeUpdates(before, updated, actor);
        await historyService.SaveChangesAsync(cancellationToken);
        return updated;
    }

    public async Task<EmployeeDto> CreateHrStaffEmployeeAsync(
        CreateHrStaffEmployeeRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ValidateCreateRequest(request);

        var payCode = request.PayCode.Trim();
        var existing = await GetByEmployeeNumberAsync(EmployeeDataSource.HrStaff, payCode, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("An employee with this pay code already exists.");

        var (firstName, lastName) = SplitFullName(request.FullName);
        decimal? basicSalary2027 = request.BasicSalary2027 > 0 ? request.BasicSalary2027 : null;
        decimal? stagnationAllowance = request.StagnationAllowance > 0 ? request.StagnationAllowance : null;
        var salaryPoint = request.SalaryPoint ?? 0;

        var affected = await hrStaffDbContext.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO dbo.Employees
            (
                PayCode,
                Sex,
                FirstName,
                LastName,
                DateOfBirth,
                DateJoined,
                DateOfPromotion,
                IncrementLevel,
                SalaryPoint,
                StagnationAllowance,
                StagnationAllowanceNote,
                DateRetired,
                NextIncrementDate,
                PayableSalary2026,
                PostDescription,
                BasicSalary2027,
                SalaryScale,
                StartPoint,
                IncrementAmount,
                SequenceNumber,
                NumberOfIncrements,
                ExistingGradeCode,
                NewGrade,
                WorkLocation,
                Department
            )
            VALUES
            (
                {payCode},
                {request.Sex.Trim()},
                {firstName},
                {lastName},
                {request.DateOfBirth},
                {request.AppointmentDate},
                {request.PromotionDate},
                {salaryPoint},
                {salaryPoint},
                {stagnationAllowance},
                NULL,
                NULL,
                {request.NextIncrementDate},
                {request.CurrentSalary},
                {request.Designation.Trim()},
                {basicSalary2027},
                {NullIfWhiteSpace(request.SalaryScale)},
                {request.CurrentSalary},
                {request.IncrementAmount},
                0,
                0,
                {request.Grade.Trim()},
                {request.Grade.Trim()},
                {(request.Location ?? string.Empty).Trim()},
                {(request.Department ?? string.Empty).Trim()}
            )
            """, cancellationToken);

        if (affected != 1)
            throw new InvalidOperationException("Employee record could not be created.");

        var created = await GetByEmployeeNumberAsync(EmployeeDataSource.HrStaff, payCode, cancellationToken)
            ?? throw new KeyNotFoundException("Employee record could not be reloaded after create.");
        historyService.Track(new EmployeeHistoryEntry(
            created.EmployeeNumber,
            created.PayCode,
            created.FullName,
            DataSourceName,
            "EmployeeCreated",
            "Employee record was created from the HR system.",
            actor,
            timeProvider.GetUtcNow())
            .WithPromotionChange(null, created.Grade, created.PromotionDate)
            .WithIncrement(Guid.Empty, created.IncrementDate ?? created.AppointmentDate,
                null, created.SalaryPoint, null, created.CurrentSalary, created.IncrementAmount));
        await historyService.SaveChangesAsync(cancellationToken);
        return created;
    }

    public async Task<EmployeeLookupOptionsDto> GetLookupOptionsAsync(
        EmployeeDataSource dataSource,
        CancellationToken cancellationToken)
    {
        var departments = await DistinctValuesAsync(Rows().Select(x => x.Department), cancellationToken);
        var locations = await DistinctValuesAsync(Rows().Select(x => x.Location), cancellationToken);
        var employeeSalaryScales = await DistinctValuesAsync(Rows().Select(x => x.SalaryScale), cancellationToken);
        var conversionSalaryScales = await hrStaffDbContext.Database
            .SqlQueryRaw<string>("""
                SELECT DISTINCT LTRIM(RTRIM(GazetteCode)) AS Value
                FROM dbo.SalaryConversionPoints
                WHERE NULLIF(LTRIM(RTRIM(GazetteCode)), '') IS NOT NULL
                """)
            .ToListAsync(cancellationToken);
        var employeeGrades = await DistinctValuesAsync(Rows().Select(x => x.Grade), cancellationToken);
        var conversionGrades = await hrStaffDbContext.Database
            .SqlQueryRaw<string>("""
                SELECT DISTINCT LTRIM(RTRIM(GradeCode)) AS Value
                FROM dbo.SalaryConversionPoints
                WHERE NULLIF(LTRIM(RTRIM(GradeCode)), '') IS NOT NULL
                """)
            .ToListAsync(cancellationToken);
        var designations = await DistinctValuesAsync(Rows().Select(x => x.Designation), cancellationToken);
        var salarySteps = await hrStaffDbContext.Database
            .SqlQueryRaw<EmployeeSalaryStepOptionDto>("""
                SELECT
                    LTRIM(RTRIM(GradeCode)) AS GradeCode,
                    LTRIM(RTRIM(GazetteCode)) AS GazetteCode,
                    SalaryStep,
                    BasicSalary2026,
                    BasicSalary2027,
                    IncrementAmount
                FROM dbo.SalaryConversionPoints
                ORDER BY GradeCode, SalaryStep
                """)
            .ToListAsync(cancellationToken);

        return new EmployeeLookupOptionsDto(
            departments,
            locations,
            MergeValues(employeeSalaryScales, conversionSalaryScales),
            MergeValues(employeeGrades, conversionGrades),
            designations,
            salarySteps);
    }

    public async Task<IReadOnlyList<DepartmentSummaryDto>> GetDepartmentsAsync(
        EmployeeDataSource dataSource,
        CancellationToken cancellationToken)
    {
        var departments = await Rows()
            .GroupBy(x => x.Department == string.Empty ? "Unassigned" : x.Department)
            .Select(group => new DepartmentSummaryDto(group.Key, group.Count()))
            .ToListAsync(cancellationToken);

        return departments
            .OrderBy(x => x.Name == "Unassigned")
            .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<IReadOnlyList<EmployeeDto>> GetDueIncrementsAsync(
        EmployeeDataSource dataSource,
        DateOnly from,
        DateOnly to,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (to < from) throw new ArgumentException("The end date must not precede the start date.");
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        return await Project(Rows()
            .Where(x => x.IncrementDate >= from && x.IncrementDate <= to)
            .OrderBy(x => x.IncrementDate)
            .ThenBy(x => x.EmployeeNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize))
            .ToListAsync(cancellationToken);
    }

    private IQueryable<HrStaffEmployeeRow> Rows() =>
        hrStaffDbContext.Employees.AsNoTracking();

    private const string DataSourceName = "hr-staff";

    private void TrackEmployeeUpdates(EmployeeDto before, EmployeeDto updated, string actor)
    {
        var occurredAtUtc = timeProvider.GetUtcNow();

        TrackChange("Employee name", before.FullName, updated.FullName);
        TrackChange("Designation", before.Designation, updated.Designation);
        TrackChange("Grade", before.Grade, updated.Grade, promotionDate: updated.PromotionDate);
        TrackChange("Department", before.Department, updated.Department);
        TrackChange("Location", before.Location, updated.Location);
        TrackChange("Salary scale", before.SalaryScale, updated.SalaryScale);
        TrackChange("Appointment date", FormatDate(before.AppointmentDate), FormatDate(updated.AppointmentDate));
        TrackChange("Promotion date", FormatDate(before.PromotionDate), FormatDate(updated.PromotionDate));
        TrackChange("Next increment date", FormatDate(before.IncrementDate), FormatDate(updated.IncrementDate));
        TrackChange("Current salary", FormatMoney(before.CurrentSalary), FormatMoney(updated.CurrentSalary));
        TrackChange("Basic salary 2027", FormatMoney(before.PresentBasicSalary), FormatMoney(updated.PresentBasicSalary));
        TrackChange("Increment amount", FormatMoney(before.IncrementAmount), FormatMoney(updated.IncrementAmount));
        TrackChange("Stagnation allowance", FormatMoney(before.StagnationAllowance), FormatMoney(updated.StagnationAllowance));
        TrackChange("Salary point", before.SalaryPoint?.ToString(), updated.SalaryPoint?.ToString());

        if (before.SalaryPoint != updated.SalaryPoint ||
            before.CurrentSalary != updated.CurrentSalary ||
            before.PresentBasicSalary != updated.PresentBasicSalary ||
            before.IncrementAmount != updated.IncrementAmount)
        {
            historyService.Track(new EmployeeHistoryEntry(
                updated.EmployeeNumber,
                updated.PayCode,
                updated.FullName,
                DataSourceName,
                "SalaryStepAdjusted",
                "Salary step details were changed from the Employee page.",
                actor,
                occurredAtUtc)
                .WithIncrement(
                    Guid.Empty,
                    updated.IncrementDate ?? updated.AppointmentDate,
                    before.SalaryPoint,
                    updated.SalaryPoint,
                    before.CurrentSalary,
                    updated.CurrentSalary,
                    updated.IncrementAmount));
        }

        void TrackChange(
            string fieldName,
            string? previousValue,
            string? newValue,
            DateOnly? promotionDate = null)
        {
            if (string.Equals(
                    Normalize(previousValue),
                    Normalize(newValue),
                    StringComparison.Ordinal))
            {
                return;
            }

            var entry = new EmployeeHistoryEntry(
                updated.EmployeeNumber,
                updated.PayCode,
                updated.FullName,
                DataSourceName,
                fieldName == "Grade" || fieldName == "Promotion date"
                    ? "PromotionChanged"
                    : "EmployeeUpdated",
                $"{fieldName} changed.",
                actor,
                occurredAtUtc)
                .WithFieldChange(fieldName, previousValue, newValue);

            if (fieldName == "Grade")
                entry.WithPromotionChange(previousValue, newValue, promotionDate);

            historyService.Track(entry);
        }
    }

    private static async Task<IReadOnlyList<string>> DistinctValuesAsync(
        IQueryable<string> query,
        CancellationToken cancellationToken)
    {
        var values = await query
            .Where(value => value.Trim() != string.Empty)
            .Select(value => value.Trim())
            .Distinct()
            .ToListAsync(cancellationToken);

        return values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static IReadOnlyList<string> MergeValues(
        IEnumerable<string> first,
        IEnumerable<string> second) =>
        first.Concat(second)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static string? NullIfWhiteSpace(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static string? FormatDate(DateOnly? value) =>
        value?.ToString("yyyy-MM-dd");

    private static string FormatDate(DateOnly value) =>
        value.ToString("yyyy-MM-dd");

    private static string? FormatMoney(decimal value) =>
        value == 0 ? null : decimal.Round(value, 2).ToString("0.##");

    private static (string FirstName, string LastName) SplitFullName(string fullName)
    {
        var normalized = string.Join(' ', fullName
            .Trim()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        var splitIndex = normalized.LastIndexOf(' ');
        if (splitIndex <= 0) return (normalized, string.Empty);

        return (
            normalized[..splitIndex],
            normalized[(splitIndex + 1)..]);
    }

    private static void ValidateCreateRequest(CreateHrStaffEmployeeRequest request)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.PayCode);
        if (request.DateOfBirth == default)
            throw new InvalidOperationException("Date of birth is required.");
        if (request.AppointmentDate == default)
            throw new InvalidOperationException("Appointment date is required.");
        if (string.IsNullOrWhiteSpace(request.Sex))
            throw new InvalidOperationException("Sex is required.");
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new InvalidOperationException("Employee name is required.");
        if (string.IsNullOrWhiteSpace(request.Designation))
            throw new InvalidOperationException("Designation is required.");
        if (string.IsNullOrWhiteSpace(request.Grade))
            throw new InvalidOperationException("Grade is required.");
        if (request.CurrentSalary <= 0)
            throw new InvalidOperationException("Current salary must be greater than zero.");
    }

    private static IQueryable<EmployeeDto> Project(IQueryable<HrStaffEmployeeRow> query) => query
        .Select(x => new EmployeeDto(
            x.EmployeeNumber,
            x.PayCode,
            x.FullName,
            x.Designation,
            x.Grade,
            x.Department,
            x.Location,
            x.AppointmentDate,
            x.PromotionDate,
            x.IncrementDate,
            x.CurrentSalary,
            x.PresentBasicSalary,
            x.PresentPayableSalary,
            x.SalaryPoint,
            x.IncrementAmount,
            x.ConvertedSalary,
            x.PayableSalary,
            x.StagnationAllowance,
            x.SalaryScale,
            x.SalaryConversionStatus));

    private static IQueryable<HrStaffEmployeeRow> ApplySorting(
        IQueryable<HrStaffEmployeeRow> query,
        string? sortBy,
        string? sortDirection)
    {
        var descending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
        var normalizedSortBy = sortBy?.Trim().ToLowerInvariant();

        return normalizedSortBy switch
        {
            "paycode" => descending
                ? query.OrderByDescending(x => x.PayCode).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.PayCode).ThenBy(x => x.EmployeeNumber),
            "designation" => descending
                ? query.OrderByDescending(x => x.Designation).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.Designation).ThenBy(x => x.EmployeeNumber),
            "grade" => descending
                ? query.OrderByDescending(x => x.Grade).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.Grade).ThenBy(x => x.EmployeeNumber),
            "department" => descending
                ? query.OrderByDescending(x => x.Department).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.Department).ThenBy(x => x.EmployeeNumber),
            "location" => descending
                ? query.OrderByDescending(x => x.Location).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.Location).ThenBy(x => x.EmployeeNumber),
            "incrementdate" => descending
                ? query.OrderByDescending(x => x.IncrementDate).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.IncrementDate).ThenBy(x => x.EmployeeNumber),
            "currentsalary" => descending
                ? query.OrderByDescending(x => x.CurrentSalary).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.CurrentSalary).ThenBy(x => x.EmployeeNumber),
            _ => descending
                ? query.OrderByDescending(x => x.FullName).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.FullName).ThenBy(x => x.EmployeeNumber),
        };
    }
}
