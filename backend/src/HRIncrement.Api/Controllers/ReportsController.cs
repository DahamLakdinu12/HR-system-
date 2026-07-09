using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRIncrement.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
[Authorize(Policy = "CanProcessIncrements")]
public sealed class ReportsController(IReportsService reportsService) : ControllerBase
{
    private const string DataSourceHeader = "X-Employee-Data-Source";

    [HttpGet("monthly-summary")]
    public Task<ActionResult<MonthlyReportSummaryDto>> GetMonthlySummary(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Execute(
            () => reportsService.GetMonthlySummaryAsync(
                ParseDataSource(dataSource), year, month, cancellationToken));

    [HttpGet("increment-register")]
    [Produces("application/pdf")]
    public Task<IActionResult> GetIncrementRegister(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Download(
            () => reportsService.GenerateIncrementRegisterAsync(
                ParseDataSource(dataSource), year, month, cancellationToken));

    [HttpGet("monthly-approvals")]
    [Produces("application/pdf")]
    public Task<IActionResult> GetMonthlyApprovals(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Download(
            () => reportsService.GenerateApprovalReportAsync(
                ParseDataSource(dataSource), year, month, cancellationToken));

    private async Task<ActionResult<MonthlyReportSummaryDto>> Execute(
        Func<Task<MonthlyReportSummaryDto>> action)
    {
        try
        {
            return Ok(await action());
        }
        catch (ArgumentOutOfRangeException error)
        {
            return BadRequest(new ProblemDetails { Title = error.Message });
        }
    }

    private async Task<IActionResult> Download(Func<Task<ReportDocumentDto>> action)
    {
        try
        {
            var report = await action();
            return File(report.Content, "application/pdf", report.FileName);
        }
        catch (ArgumentOutOfRangeException error)
        {
            return BadRequest(new ProblemDetails { Title = error.Message });
        }
    }

    private static EmployeeDataSource ParseDataSource(string? value) =>
        EmployeeDataSource.HrStaff;
}
