using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRIncrement.Api.Controllers;

[ApiController]
[Route("api/v1/increments")]
[Authorize(Policy = "CanProcessIncrements")]
public sealed class IncrementsController(
    IIncrementCalculationService calculationService,
    IAssessmentPdfGenerator pdfGenerator,
    IAssessmentLeaveParticularsProvider leaveParticularsProvider) : ControllerBase
{
    [HttpPost("calculate")]
    public ActionResult<IncrementCalculationDto> Calculate(CalculateIncrementRequest request) =>
        Ok(calculationService.Calculate(request));

    [HttpPost("assessment-form")]
    [Produces("application/pdf")]
    public async Task<IActionResult> GenerateAssessmentForm(
        AssessmentFormDto request,
        CancellationToken cancellationToken)
    {
        var assessment = await WithLeaveParticularsAsync(request, cancellationToken);
        return File(pdfGenerator.Generate(assessment), "application/pdf", "increment-assessment.pdf");
    }

    [HttpPost("assessment-forms")]
    [Produces("application/pdf")]
    public async Task<IActionResult> GenerateAssessmentForms(
        IReadOnlyList<AssessmentFormDto> requests,
        CancellationToken cancellationToken)
    {
        if (requests.Count == 0)
            return BadRequest(new ProblemDetails { Title = "Select at least one employee." });

        var assessments = await Task.WhenAll(
            requests.Select(request => WithLeaveParticularsAsync(request, cancellationToken)));

        return File(
            pdfGenerator.GenerateMany(assessments),
            "application/pdf",
            "increment-assessments.pdf");
    }

    private async Task<AssessmentFormDto> WithLeaveParticularsAsync(
        AssessmentFormDto request,
        CancellationToken cancellationToken)
    {
        if (request.LeaveParticulars is not null)
            return request;

        var leaveParticulars = await leaveParticularsProvider.GetLeaveParticularsAsync(
            request,
            cancellationToken);

        return leaveParticulars is null
            ? request
            : request with { LeaveParticulars = leaveParticulars };
    }
}
