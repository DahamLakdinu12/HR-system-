using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IIncrementCalculationService
{
    IncrementCalculationDto Calculate(CalculateIncrementRequest request);
}
