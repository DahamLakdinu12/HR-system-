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
    IAssessmentPdfGenerator pdfGenerator) : ControllerBase
{
    [HttpPost("calculate")]
    public ActionResult<IncrementCalculationDto> Calculate(CalculateIncrementRequest request) =>
        Ok(calculationService.Calculate(request));

    [HttpPost("assessment-form")]
    [Produces("application/pdf")]
    public IActionResult GenerateAssessmentForm(AssessmentFormDto request) =>
        File(pdfGenerator.Generate(request), "application/pdf", "increment-assessment.pdf");

    [HttpPost("assessment-forms")]
    [Produces("application/pdf")]
    public IActionResult GenerateAssessmentForms(IReadOnlyList<AssessmentFormDto> requests)
    {
        if (requests.Count == 0)
            return BadRequest(new ProblemDetails { Title = "Select at least one employee." });

        return File(
            pdfGenerator.GenerateMany(requests),
            "application/pdf",
            "increment-assessments.pdf");
    }
}
