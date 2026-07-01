using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IAssessmentPdfGenerator
{
    byte[] Generate(AssessmentFormDto assessment);
    byte[] GenerateMany(IReadOnlyCollection<AssessmentFormDto> assessments);
}
