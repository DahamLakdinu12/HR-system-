using HRIncrement.Domain.Common;

namespace HRIncrement.Domain.Entities;

public sealed class SalaryScale : Entity
{
    private readonly List<SalaryScalePoint> _points = [];

    private SalaryScale() { }

    public SalaryScale(Guid gazetteId, string code, string grade, decimal maximumSalary)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        ArgumentException.ThrowIfNullOrWhiteSpace(grade);
        if (maximumSalary <= 0) throw new ArgumentOutOfRangeException(nameof(maximumSalary));
        GazetteId = gazetteId;
        Code = code.Trim();
        Grade = grade.Trim();
        MaximumSalary = maximumSalary;
    }

    public Guid GazetteId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Grade { get; private set; } = string.Empty;
    public decimal MaximumSalary { get; private set; }
    public IReadOnlyCollection<SalaryScalePoint> Points => _points;

    public void AddPoint(int pointNumber, decimal salary, decimal incrementAmount)
    {
        if (_points.Any(x => x.PointNumber == pointNumber))
            throw new InvalidOperationException($"Salary point {pointNumber} already exists.");

        _points.Add(new SalaryScalePoint(Id, pointNumber, salary, incrementAmount));
    }
}

public sealed class SalaryScalePoint : Entity
{
    private SalaryScalePoint() { }

    internal SalaryScalePoint(Guid salaryScaleId, int pointNumber, decimal salary, decimal incrementAmount)
    {
        if (pointNumber < 1) throw new ArgumentOutOfRangeException(nameof(pointNumber));
        if (salary < 0) throw new ArgumentOutOfRangeException(nameof(salary));
        if (incrementAmount < 0) throw new ArgumentOutOfRangeException(nameof(incrementAmount));
        SalaryScaleId = salaryScaleId;
        PointNumber = pointNumber;
        Salary = salary;
        IncrementAmount = incrementAmount;
    }

    public Guid SalaryScaleId { get; private set; }
    public int PointNumber { get; private set; }
    public decimal Salary { get; private set; }
    public decimal IncrementAmount { get; private set; }
}
