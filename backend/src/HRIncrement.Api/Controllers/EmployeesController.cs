using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRIncrement.Api.Controllers;

[ApiController]
[Route("api/v1/employees")]
[Authorize(Policy = "CanReadEmployees")]
public sealed class EmployeesController(IHcmEmployeeReader employeeReader) : ControllerBase
{
    private const string DataSourceHeader = "X-Employee-Data-Source";

    [HttpGet]
    [ProducesResponseType<EmployeeSearchResultDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<EmployeeSearchResultDto>> Search(
        [FromQuery] string? search,
        [FromQuery] string? payCode,
        [FromQuery] string? department,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDirection,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromHeader(Name = DataSourceHeader)] string? dataSource = null,
        CancellationToken cancellationToken = default) =>
        Ok(await employeeReader.SearchAsync(ParseDataSource(dataSource), search, payCode, department, sortBy, sortDirection, page, pageSize, cancellationToken));

    [HttpGet("departments")]
    [ProducesResponseType<IReadOnlyList<DepartmentSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DepartmentSummaryDto>>> GetDepartments(
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken) =>
        Ok(await employeeReader.GetDepartmentsAsync(ParseDataSource(dataSource), cancellationToken));

    [HttpGet("{employeeNumber}")]
    [ProducesResponseType<EmployeeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetByEmployeeNumber(
        string employeeNumber,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken)
    {
        var employee = await employeeReader.GetByEmployeeNumberAsync(
            ParseDataSource(dataSource),
            employeeNumber,
            cancellationToken);
        return employee is null ? NotFound() : Ok(employee);
    }

    [HttpPut("{employeeNumber}")]
    [Authorize(Policy = "CanProcessIncrements")]
    [ProducesResponseType<EmployeeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployeeDto>> UpdateHrStaffEmployee(
        string employeeNumber,
        UpdateHrStaffEmployeeRequest request,
        [FromHeader(Name = DataSourceHeader)] string? dataSource,
        CancellationToken cancellationToken)
    {
        if (ParseDataSource(dataSource) != EmployeeDataSource.HrStaff)
            return Conflict(new ProblemDetails { Title = "HCM is read-only. Select the HR staff database before editing employees." });

        try
        {
            return Ok(await employeeReader.UpdateHrStaffEmployeeAsync(
                employeeNumber,
                request,
                cancellationToken));
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

    [HttpGet("due-increments")]
    public async Task<ActionResult<IReadOnlyList<EmployeeDto>>> GetDueIncrements(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromHeader(Name = DataSourceHeader)] string? dataSource = null,
        CancellationToken cancellationToken = default) =>
        Ok(await employeeReader.GetDueIncrementsAsync(ParseDataSource(dataSource), from, to, page, pageSize, cancellationToken));

    private static EmployeeDataSource ParseDataSource(string? value) =>
        string.Equals(value, "hcm", StringComparison.OrdinalIgnoreCase)
            ? EmployeeDataSource.Hcm
            : EmployeeDataSource.HrStaff;
}
