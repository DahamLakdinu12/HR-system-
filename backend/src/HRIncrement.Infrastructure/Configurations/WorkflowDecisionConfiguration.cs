using HRIncrement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRIncrement.Infrastructure.Configurations;

public sealed class WorkflowDecisionConfiguration : IEntityTypeConfiguration<WorkflowDecision>
{
    public void Configure(EntityTypeBuilder<WorkflowDecision> builder)
    {
        builder.ToTable("WorkflowDecisions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DecidedBy).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.DecidedAtUtc);
        builder.HasIndex(x => new { x.EmployeeIncrementId, x.DecidedAtUtc });
        builder.HasOne<EmployeeIncrement>()
            .WithMany()
            .HasForeignKey(x => x.EmployeeIncrementId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
