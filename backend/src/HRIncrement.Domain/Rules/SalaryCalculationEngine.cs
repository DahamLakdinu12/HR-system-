using HRIncrement.Domain.Entities;

namespace HRIncrement.Domain.Rules;

public sealed class SalaryCalculationEngine
{
    public IncrementCalculation Calculate(SalaryCalculationInput input, DateTimeOffset calculatedAtUtc)
    {
        if (input.CurrentSalary < 0 || input.ConvertedSalary < 0 || input.IncrementAmount < 0)
            throw new ArgumentOutOfRangeException(nameof(input), "Salary values cannot be negative.");
        if (input.MaximumSalary <= 0 || input.ConvertedSalary > input.MaximumSalary)
            throw new ArgumentOutOfRangeException(nameof(input.MaximumSalary));
        if (input.SalaryPoint < 1) throw new ArgumentOutOfRangeException(nameof(input.SalaryPoint));

        var uncappedSalary = input.ConvertedSalary + input.IncrementAmount;
        var payableSalary = Math.Min(uncappedSalary, input.MaximumSalary);
        var stagnationAllowance = input.AllowStagnationAllowance
            ? Math.Max(0, uncappedSalary - input.MaximumSalary)
            : 0;

        return new IncrementCalculation(
            Round(input.CurrentSalary),
            input.SalaryPoint,
            Round(input.IncrementAmount),
            Round(input.ConvertedSalary),
            Round(payableSalary),
            Round(stagnationAllowance),
            calculatedAtUtc);
    }

    private static decimal Round(decimal value) =>
        decimal.Round(value, 2, MidpointRounding.AwayFromZero);
}

public sealed record SalaryCalculationInput(
    decimal CurrentSalary,
    int SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal MaximumSalary,
    bool AllowStagnationAllowance);
