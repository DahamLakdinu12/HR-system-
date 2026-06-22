using HRIncrement.Domain.Common;
using HRIncrement.Domain.Enums;

namespace HRIncrement.Domain.Entities;

public sealed class Gazette : AuditableEntity
{
    private readonly List<SalaryScale> _salaryScales = [];

    private Gazette() { }

    public Gazette(string referenceNumber, string title, DateOnly publishedOn, DateOnly effectiveFrom)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(referenceNumber);
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ReferenceNumber = referenceNumber.Trim();
        Title = title.Trim();
        PublishedOn = publishedOn;
        EffectiveFrom = effectiveFrom;
    }

    public string ReferenceNumber { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public DateOnly PublishedOn { get; private set; }
    public DateOnly EffectiveFrom { get; private set; }
    public DateOnly? EffectiveTo { get; private set; }
    public GazetteStatus Status { get; private set; } = GazetteStatus.Draft;
    public IReadOnlyCollection<SalaryScale> SalaryScales => _salaryScales;

    public void Publish() => Status = GazetteStatus.Published;
}
