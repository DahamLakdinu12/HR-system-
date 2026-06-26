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
    [HttpGet]
    [ProducesResponseType<EmployeeSearchResultDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<EmployeeSearchResultDto>> Search(
        [FromQuery] string? search,
        [FromQuery] string? payCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default) =>
        Ok(await employeeReader.SearchAsync(search, payCode, page, pageSize, cancellationToken));

    [HttpGet("{employeeNumber}")]
    [ProducesResponseType<EmployeeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetByEmployeeNumber(
        string employeeNumber,
        CancellationToken cancellationToken)
    {
        var employee = await employeeReader.GetByEmployeeNumberAsync(employeeNumber, cancellationToken);
        return employee is null ? NotFound() : Ok(employee);
    }

    [HttpGet("due-increments")]
    public async Task<ActionResult<IReadOnlyList<EmployeeDto>>> GetDueIncrements(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default) =>
        Ok(await employeeReader.GetDueIncrementsAsync(from, to, page, pageSize, cancellationToken));
}
