namespace HRIncrement.Domain.ValueObjects;

public readonly record struct Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency = "LKR")
    {
        if (amount < 0) throw new ArgumentOutOfRangeException(nameof(amount), "Money cannot be negative.");
        ArgumentException.ThrowIfNullOrWhiteSpace(currency);
        Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
        Currency = currency.Trim().ToUpperInvariant();
    }

    public static Money Zero(string currency = "LKR") => new(0, currency);
}
