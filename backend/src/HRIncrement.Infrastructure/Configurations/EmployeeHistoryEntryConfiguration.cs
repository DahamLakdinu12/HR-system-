using HRIncrement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRIncrement.Infrastructure.Configurations;

public sealed class EmployeeHistoryEntryConfiguration : IEntityTypeConfiguration<EmployeeHistoryEntry>
{
    public void Configure(EntityTypeBuilder<EmployeeHistoryEntry> builder)
    {
        builder.ToTable("EmployeeHistoryEntries");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EmployeeNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.PayCode).HasMaxLength(50).IsRequired();
        builder.Property(x => x.EmployeeName).HasMaxLength(300).IsRequired();
        builder.Property(x => x.DataSource).HasMaxLength(30).IsRequired();
        builder.Property(x => x.EventType).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.Actor).HasMaxLength(150).IsRequired();
        builder.Property(x => x.FieldName).HasMaxLength(150);
        builder.Property(x => x.PreviousValue).HasMaxLength(1000);
        builder.Property(x => x.NewValue).HasMaxLength(1000);
        builder.Property(x => x.PreviousSalary).HasPrecision(19, 4);
        builder.Property(x => x.NewSalary).HasPrecision(19, 4);
        builder.Property(x => x.IncrementAmount).HasPrecision(19, 4);
        builder.Property(x => x.PreviousGrade).HasMaxLength(100);
        builder.Property(x => x.NewGrade).HasMaxLength(100);
        builder.HasIndex(x => new { x.PayCode, x.OccurredAtUtc });
        builder.HasIndex(x => new { x.EmployeeNumber, x.OccurredAtUtc });
        builder.HasIndex(x => x.EmployeeIncrementId);
    }
}
