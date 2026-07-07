using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HcmEmployeeReader(
    HcmDbContext hcmDbContext,
    HrStaffDbContext hrStaffDbContext) : IHcmEmployeeReader
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

        var query = Rows(dataSource);
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
        return Project(Rows(dataSource).Where(x => x.EmployeeNumber == employeeNumber))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<EmployeeDto> UpdateHrStaffEmployeeAsync(
        string employeeNumber,
        UpdateHrStaffEmployeeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        if (request.AppointmentDate == default)
            throw new InvalidOperationException("Appointment date is required.");
        if (string.IsNullOrWhiteSpace(request.Designation))
            throw new InvalidOperationException("Designation is required.");
        if (string.IsNullOrWhiteSpace(request.Grade))
            throw new InvalidOperationException("Grade is required.");

        var affected = await hrStaffDbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE dbo.Employees
            SET PostDescription = {request.Designation.Trim()},
                NewGrade = {request.Grade.Trim()},
                Department = {request.Department.Trim()},
                WorkLocation = {request.Location.Trim()},
                DateJoined = {request.AppointmentDate},
                DateOfPromotion = {request.PromotionDate},
                NextIncrementDate = {request.NextIncrementDate}
            WHERE PayCode = {employeeNumber.Trim()}
            """, cancellationToken);

        if (affected != 1)
            throw new KeyNotFoundException("Employee record not found in the HR staff database.");

        return await GetByEmployeeNumberAsync(EmployeeDataSource.HrStaff, employeeNumber, cancellationToken)
            ?? throw new KeyNotFoundException("Employee record could not be reloaded after update.");
    }

    public async Task<IReadOnlyList<DepartmentSummaryDto>> GetDepartmentsAsync(
        EmployeeDataSource dataSource,
        CancellationToken cancellationToken)
    {
        var departments = await Rows(dataSource)
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

        return await Project(Rows(dataSource)
            .Where(x => x.IncrementDate >= from && x.IncrementDate <= to)
            .OrderBy(x => x.IncrementDate)
            .ThenBy(x => x.EmployeeNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize))
            .ToListAsync(cancellationToken);
    }

    private IQueryable<HcmEmployeeRow> Rows(EmployeeDataSource dataSource) =>
        dataSource == EmployeeDataSource.Hcm
            ? hcmDbContext.Employees.AsNoTracking()
            : hrStaffDbContext.Employees.AsNoTracking();

    private static IQueryable<EmployeeDto> Project(IQueryable<HcmEmployeeRow> query) => query
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

    private static IQueryable<HcmEmployeeRow> ApplySorting(
        IQueryable<HcmEmployeeRow> query,
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
