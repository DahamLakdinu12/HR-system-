using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using HRIncrement.Domain.Rules;

namespace HRIncrement.Application.Services;

public sealed class IncrementCalculationService(SalaryCalculationEngine engine, TimeProvider timeProvider)
    : IIncrementCalculationService
{
    public IncrementCalculationDto Calculate(CalculateIncrementRequest request)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.EmployeeNumber);

        var result = engine.Calculate(
            new SalaryCalculationInput(
                request.CurrentSalary,
                request.SalaryPoint,
                request.IncrementAmount,
                request.ConvertedSalary,
                request.MaximumSalary,
                request.AllowStagnationAllowance),
            timeProvider.GetUtcNow());

        return new IncrementCalculationDto(
            request.EmployeeNumber,
            result.CurrentSalary,
            result.SalaryPoint,
            result.IncrementAmount,
            result.ConvertedSalary,
            result.PayableSalary,
            result.StagnationAllowance,
            result.CalculatedAtUtc);
    }
}
