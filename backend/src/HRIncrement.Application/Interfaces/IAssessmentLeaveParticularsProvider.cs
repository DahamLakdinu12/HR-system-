using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IAssessmentLeaveParticularsProvider
{
    Task<AssessmentLeaveParticularsDto?> GetLeaveParticularsAsync(
        AssessmentFormDto assessment,
        CancellationToken cancellationToken = default);
}
