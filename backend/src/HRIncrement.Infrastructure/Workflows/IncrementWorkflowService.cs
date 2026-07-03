using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using HRIncrement.Domain.Entities;
using HRIncrement.Domain.Enums;
using HRIncrement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.Workflows;

internal sealed class IncrementWorkflowService(
    ApplicationDbContext applicationDbContext,
    IHcmEmployeeReader employeeReader,
    TimeProvider timeProvider) : IIncrementWorkflowService
{
    public async Task<IncrementWorkflowDto> MoveToAssessmentAsync(
        EmployeeDataSource dataSource,
        MoveToAssessmentRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        if (dataSource != EmployeeDataSource.HrStaff)
            throw new InvalidOperationException("Only the approved HR staff database can be updated.");
        if (request.SalaryPoint < 1)
            throw new InvalidOperationException("A matched salary point is required.");

        var employee = await employeeReader.GetByEmployeeNumberAsync(
            dataSource,
            request.EmployeeNumber,
            cancellationToken) ?? throw new KeyNotFoundException("Employee not found.");
        var requiresStagnationApproval = employee.SalaryConversionStatus is
            "MaximumPoint" or "Stagnation";

        if (!string.Equals(employee.PayCode, request.PayCode, StringComparison.Ordinal) ||
            employee.IncrementDate != request.IncrementDate ||
            employee.SalaryPoint != request.SalaryPoint ||
            employee.CurrentSalary != request.CurrentSalary ||
            employee.IncrementAmount != request.IncrementAmount ||
            employee.ConvertedSalary != request.ConvertedSalary ||
            employee.PayableSalary != request.PayableSalary ||
            employee.SalaryConversionStatus is not ("Applied" or "MaximumPoint" or "Stagnation") ||
            request.IsStagnationIncrement != requiresStagnationApproval)
        {
            throw new InvalidOperationException(
                "Employee salary details changed. Refresh the increment page and try again.");
        }

        var workflow = await applicationDbContext.EmployeeIncrements
            .SingleOrDefaultAsync(x =>
                x.EmployeeNumber == request.EmployeeNumber &&
                x.DueDate == request.IncrementDate &&
                x.DataSource == DataSourceName(dataSource),
                cancellationToken);

        if (workflow is null)
        {
            workflow = new EmployeeIncrement(
                employee.EmployeeNumber,
                employee.PayCode,
                employee.FullName,
                employee.Designation,
                employee.Grade,
                employee.Department,
                employee.Location,
                DataSourceName(dataSource),
                request.IncrementDate,
                Guid.Empty,
                new IncrementCalculation(
                    employee.CurrentSalary,
                    request.SalaryPoint,
                    employee.IncrementAmount,
                    employee.ConvertedSalary,
                    employee.PayableSalary,
                    employee.StagnationAllowance,
                    timeProvider.GetUtcNow(),
                    request.IsStagnationIncrement));
            applicationDbContext.EmployeeIncrements.Add(workflow);
        }

        workflow.MoveToAssessment();
        workflow.MarkModified(actor, timeProvider.GetUtcNow());
        await applicationDbContext.SaveChangesAsync(cancellationToken);
        return ToDto(workflow);
    }

    public async Task<IReadOnlyList<IncrementWorkflowDto>> ListAsync(
        EmployeeDataSource dataSource,
        string? status,
        CancellationToken cancellationToken)
    {
        var query = applicationDbContext.EmployeeIncrements
            .AsNoTracking()
            .Where(x => x.DataSource == DataSourceName(dataSource));

        query = status?.Trim().ToLowerInvariant() switch
        {
            "assessments" => query.Where(x =>
                x.Status == WorkflowStatus.PendingApproval ||
                x.Status == WorkflowStatus.Rejected),
            "approvals" => query.Where(x => x.Status == WorkflowStatus.PendingApproval),
            "approved" => query.Where(x => x.Status == WorkflowStatus.Approved),
            _ => query
        };

        var workflows = await query
            .OrderBy(x => x.DueDate)
            .ThenBy(x => x.EmployeeName)
            .ToListAsync(cancellationToken);
        return workflows.Select(ToDto).ToList();
    }

    public async Task<WorkflowCountsDto> GetCountsAsync(
        EmployeeDataSource dataSource,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        if (to < from) throw new ArgumentException("The end date must not precede the start date.");

        var workflows = await applicationDbContext.EmployeeIncrements
            .AsNoTracking()
            .Where(x => x.DataSource == DataSourceName(dataSource))
            .Select(x => new { x.EmployeeNumber, x.DueDate, x.Status })
            .ToListAsync(cancellationToken);

        var blockedIncrementKeys = workflows
            .Where(x => x.Status is not (WorkflowStatus.Draft or WorkflowStatus.ReturnedToIncrement))
            .Select(x => (x.EmployeeNumber, x.DueDate))
            .ToHashSet();

        var dueEmployees = new List<EmployeeDto>();
        const int pageSize = 200;
        for (var page = 1; ; page++)
        {
            var batch = await employeeReader.GetDueIncrementsAsync(
                dataSource, from, to, page, pageSize, cancellationToken);
            dueEmployees.AddRange(batch);
            if (batch.Count < pageSize) break;
        }

        var increments = dueEmployees.Count(employee =>
            employee.IncrementDate is { } dueDate &&
            !blockedIncrementKeys.Contains((employee.EmployeeNumber, dueDate)));
        var assessments = workflows.Count(x =>
            x.Status is WorkflowStatus.PendingApproval or WorkflowStatus.Rejected);
        var approvals = workflows.Count(x => x.Status == WorkflowStatus.PendingApproval);

        return new WorkflowCountsDto(increments, assessments, approvals);
    }

    public async Task<IncrementWorkflowDto> ApproveAsync(
        EmployeeDataSource dataSource,
        Guid id,
        string actor,
        CancellationToken cancellationToken)
    {
        if (dataSource != EmployeeDataSource.HrStaff)
            throw new InvalidOperationException("HCM is read-only and cannot be updated.");

        var strategy = applicationDbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            var workflow = await FindAsync(dataSource, id, cancellationToken);
            if (workflow.Status != WorkflowStatus.PendingApproval)
                throw new InvalidOperationException("This workflow is not waiting for approval.");

            await using var transaction =
                await applicationDbContext.Database.BeginTransactionAsync(cancellationToken);

            var newSalary = decimal.Round(
                workflow.Calculation.PayableSalary,
                0,
                MidpointRounding.AwayFromZero);
            var affected = await applicationDbContext.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE [HRStaff].[dbo].[Employees]
                SET PayableSalary2026 = {newSalary},
                    NextIncrementDate = DATEADD(year, 1, NextIncrementDate),
                    NumberOfIncrements = COALESCE(NumberOfIncrements, 0) + 1
            WHERE PayCode = {workflow.PayCode}
              AND PayableSalary2026 = {workflow.Calculation.CurrentSalary}
              AND NextIncrementDate = {workflow.DueDate}
            """, cancellationToken);

            if (affected != 1)
                throw new InvalidOperationException(
                    "The employee salary changed before approval. Refresh and review the record.");

            workflow.Approve();
            var decidedAtUtc = timeProvider.GetUtcNow();
            workflow.MarkModified(actor, decidedAtUtc);
            applicationDbContext.WorkflowDecisions.Add(
                new WorkflowDecision(workflow.Id, true, actor, decidedAtUtc));
            await applicationDbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return ToDto(workflow);
        });
    }

    public async Task<IncrementWorkflowDto> RejectAsync(
        EmployeeDataSource dataSource,
        Guid id,
        string actor,
        CancellationToken cancellationToken)
    {
        var workflow = await FindAsync(dataSource, id, cancellationToken);
        workflow.Reject();
        var decidedAtUtc = timeProvider.GetUtcNow();
        workflow.MarkModified(actor, decidedAtUtc);
        applicationDbContext.WorkflowDecisions.Add(
            new WorkflowDecision(workflow.Id, false, actor, decidedAtUtc));
        await applicationDbContext.SaveChangesAsync(cancellationToken);
        return ToDto(workflow);
    }

    public Task<IncrementWorkflowDto> ReturnToIncrementAsync(
        EmployeeDataSource dataSource,
        Guid id,
        string actor,
        CancellationToken cancellationToken) =>
        TransitionAsync(dataSource, id, actor, workflow => workflow.ReturnToIncrement(), cancellationToken);

    private async Task<IncrementWorkflowDto> TransitionAsync(
        EmployeeDataSource dataSource,
        Guid id,
        string actor,
        Action<EmployeeIncrement> transition,
        CancellationToken cancellationToken)
    {
        var workflow = await FindAsync(dataSource, id, cancellationToken);
        transition(workflow);
        workflow.MarkModified(actor, timeProvider.GetUtcNow());
        await applicationDbContext.SaveChangesAsync(cancellationToken);
        return ToDto(workflow);
    }

    private async Task<EmployeeIncrement> FindAsync(
        EmployeeDataSource dataSource,
        Guid id,
        CancellationToken cancellationToken) =>
        await applicationDbContext.EmployeeIncrements.SingleOrDefaultAsync(
            x => x.Id == id && x.DataSource == DataSourceName(dataSource),
            cancellationToken) ?? throw new KeyNotFoundException("Workflow record not found.");

    private static string DataSourceName(EmployeeDataSource dataSource) =>
        dataSource == EmployeeDataSource.Hcm ? "hcm" : "hr-staff";

    private static IncrementWorkflowDto ToDto(EmployeeIncrement workflow) => new(
        workflow.Id,
        workflow.EmployeeNumber,
        workflow.PayCode,
        workflow.EmployeeName,
        workflow.Designation,
        workflow.Grade,
        workflow.Department,
        workflow.Location,
        workflow.DataSource,
        workflow.DueDate,
        workflow.Calculation.CurrentSalary,
        workflow.Calculation.SalaryPoint,
        workflow.Calculation.IncrementAmount,
        workflow.Calculation.ConvertedSalary,
        workflow.Calculation.PayableSalary,
        workflow.Calculation.StagnationAllowance,
        workflow.Calculation.IsStagnationIncrement,
        workflow.Status.ToString(),
        workflow.CreatedAtUtc,
        workflow.ModifiedAtUtc);
}
