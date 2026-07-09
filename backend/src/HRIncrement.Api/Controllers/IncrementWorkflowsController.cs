using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRIncrement.Api.Controllers;

[ApiController]
[Route("api/v1/increment-workflows")]
[Authorize(Policy = "CanProcessIncrements")]
public sealed class IncrementWorkflowsController(
    IIncrementWorkflowService workflowService) : ControllerBase
{
    private const string DataSourceHeader = "X-Employee-Data-Source";

    [HttpPost]
    public async Task<ActionResult<IncrementWorkflowDto>> MoveToAssessment(
        MoveToAssessmentRequest request,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken)
    {
        try
        {
            var workflow = await workflowService.MoveToAssessmentAsync(
                ParseDataSource(dataSource), request, Actor(), cancellationToken);
            return Ok(workflow);
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(new ProblemDetails { Title = error.Message });
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new ProblemDetails { Title = error.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IncrementWorkflowDto>>> List(
        [FromQuery] string? status,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Ok(await workflowService.ListAsync(ParseDataSource(dataSource), status, cancellationToken));

    [HttpGet("counts")]
    public async Task<ActionResult<WorkflowCountsDto>> Counts(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Ok(await workflowService.GetCountsAsync(
            ParseDataSource(dataSource), from, to, cancellationToken));

    [HttpPost("{id:guid}/approve")]
    public Task<ActionResult<IncrementWorkflowDto>> Approve(
        Guid id,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Transition(id, dataSource, workflowService.ApproveAsync, cancellationToken);

    [HttpPost("{id:guid}/reject")]
    public Task<ActionResult<IncrementWorkflowDto>> Reject(
        Guid id,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Transition(id, dataSource, workflowService.RejectAsync, cancellationToken);

    [HttpPost("{id:guid}/return-to-increments")]
    public Task<ActionResult<IncrementWorkflowDto>> ReturnToIncrements(
        Guid id,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Transition(id, dataSource, workflowService.ReturnToIncrementAsync, cancellationToken);

    private async Task<ActionResult<IncrementWorkflowDto>> Transition(
        Guid id,
        string? dataSource,
        Func<EmployeeDataSource, Guid, string, CancellationToken, Task<IncrementWorkflowDto>> action,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await action(ParseDataSource(dataSource), id, Actor(), cancellationToken));
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(new ProblemDetails { Title = error.Message });
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new ProblemDetails { Title = error.Message });
        }
    }

    private string Actor() => User.Identity?.Name ?? "system";

    private static EmployeeDataSource ParseDataSource(string? value) =>
        EmployeeDataSource.HrStaff;
}
