using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IIncrementWorkflowService
{
    Task<IncrementWorkflowDto> MoveToAssessmentAsync(
        EmployeeDataSource dataSource,
        MoveToAssessmentRequest request,
        string actor,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<IncrementWorkflowDto>> ListAsync(
        EmployeeDataSource dataSource,
        string? status,
        CancellationToken cancellationToken);

    Task<WorkflowCountsDto> GetCountsAsync(
        EmployeeDataSource dataSource,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken);

    Task<IncrementWorkflowDto> ApproveAsync(
        EmployeeDataSource dataSource,
        Guid id,
        string actor,
        CancellationToken cancellationToken);

    Task<IncrementWorkflowDto> RejectAsync(
        EmployeeDataSource dataSource,
        Guid id,
        string actor,
        CancellationToken cancellationToken);

    Task<IncrementWorkflowDto> ReturnToIncrementAsync(
        EmployeeDataSource dataSource,
        Guid id,
        string actor,
        CancellationToken cancellationToken);
}
