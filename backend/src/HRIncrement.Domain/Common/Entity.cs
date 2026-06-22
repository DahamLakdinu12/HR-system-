namespace HRIncrement.Domain.Common;

public abstract class Entity
{
    public Guid Id { get; protected init; } = Guid.NewGuid();
}

public abstract class AuditableEntity : Entity
{
    public DateTimeOffset CreatedAtUtc { get; private set; } = DateTimeOffset.UtcNow;
    public string CreatedBy { get; private set; } = "system";
    public DateTimeOffset? ModifiedAtUtc { get; private set; }
    public string? ModifiedBy { get; private set; }

    public void MarkModified(string actor, DateTimeOffset occurredAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ModifiedBy = actor;
        ModifiedAtUtc = occurredAtUtc;
    }
}
