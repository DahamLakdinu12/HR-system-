using HRIncrement.Domain.Rules;
using Xunit;

namespace HRIncrement.UnitTests;

public sealed class SalaryCalculationEngineTests
{
    [Fact]
    public void Calculate_WhenIncrementExceedsMaximum_CapsSalaryAndPaysStagnationAllowance()
    {
        var now = new DateTimeOffset(2026, 6, 22, 0, 0, 0, TimeSpan.Zero);
        var result = new SalaryCalculationEngine().Calculate(
            new SalaryCalculationInput(85_000, 12, 3_000, 99_000, 100_000, true),
            now);

        Assert.Equal(100_000, result.PayableSalary);
        Assert.Equal(2_000, result.StagnationAllowance);
        Assert.Equal(now, result.CalculatedAtUtc);
    }

    [Fact]
    public void Calculate_WhenStagnationIsDisabled_DoesNotPayOverflow()
    {
        var result = new SalaryCalculationEngine().Calculate(
            new SalaryCalculationInput(85_000, 12, 3_000, 99_000, 100_000, false),
            DateTimeOffset.UtcNow);

        Assert.Equal(100_000, result.PayableSalary);
        Assert.Equal(0, result.StagnationAllowance);
    }
}
