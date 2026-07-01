using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using HRIncrement.Domain.Enums;
using HRIncrement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.Reports;

internal sealed class ReportDataReader(
    ApplicationDbContext applicationDbContext,
    IHcmEmployeeReader employeeReader)
{
    public async Task<IReadOnlyList<IncrementRegisterRowDto>> GetIncrementRowsAsync(
        EmployeeDataSource dataSource,
        int year,
        int month,
        CancellationToken cancellationToken)
    {
        var (from, to) = MonthRange(year, month);
        var sourceName = dataSource == EmployeeDataSource.Hcm ? "hcm" : "hr-staff";
        var blockedKeys = await applicationDbContext.EmployeeIncrements
            .AsNoTracking()
            .Where(x =>
                x.DataSource == sourceName &&
                x.DueDate >= from &&
                x.DueDate <= to &&
                x.Status != WorkflowStatus.Draft &&
                x.Status != WorkflowStatus.ReturnedToIncrement)
            .Select(x => new { x.EmployeeNumber, x.DueDate })
            .ToListAsync(cancellationToken);
        var blocked = blockedKeys
            .Select(x => (x.EmployeeNumber, x.DueDate))
            .ToHashSet();

        var employees = new List<EmployeeDto>();
        const int pageSize = 200;
        for (var page = 1; ; page++)
        {
            var batch = await employeeReader.GetDueIncrementsAsync(
                dataSource,
                from,
                to,
                page,
                pageSize,
                cancellationToken);
            employees.AddRange(batch);
            if (batch.Count < pageSize) break;
        }

        return employees
            .Where(employee =>
                employee.IncrementDate is { } incrementDate &&
                !blocked.Contains((employee.EmployeeNumber, incrementDate)))
            .OrderBy(employee => employee.IncrementDate)
            .ThenBy(employee => employee.PayCode)
            .Select(employee => new IncrementRegisterRowDto(
                employee.EmployeeNumber,
                employee.PayCode,
                employee.FullName,
                employee.Designation,
                employee.Grade,
                employee.Department,
                employee.Location,
                employee.IncrementDate!.Value,
                employee.CurrentSalary,
                employee.SalaryPoint,
                employee.IncrementAmount,
                employee.ConvertedSalary,
                employee.PayableSalary,
                employee.SalaryConversionStatus))
            .ToList();
    }

    public static (DateOnly From, DateOnly To) MonthRange(int year, int month)
    {
        if (year is < 2000 or > 2100)
            throw new ArgumentOutOfRangeException(nameof(year), "Year must be between 2000 and 2100.");
        if (month is < 1 or > 12)
            throw new ArgumentOutOfRangeException(nameof(month), "Month must be between 1 and 12.");

        var from = new DateOnly(year, month, 1);
        return (from, from.AddMonths(1).AddDays(-1));
    }
}
