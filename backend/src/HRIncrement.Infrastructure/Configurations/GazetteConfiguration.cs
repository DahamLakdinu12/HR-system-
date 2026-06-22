using HRIncrement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRIncrement.Infrastructure.Configurations;

public sealed class GazetteConfiguration : IEntityTypeConfiguration<Gazette>
{
    public void Configure(EntityTypeBuilder<Gazette> builder)
    {
        builder.ToTable("Gazettes");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ReferenceNumber).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => x.ReferenceNumber).IsUnique();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        builder.HasMany(x => x.SalaryScales).WithOne().HasForeignKey(x => x.GazetteId);
    }
}

public sealed class SalaryScaleConfiguration : IEntityTypeConfiguration<SalaryScale>
{
    public void Configure(EntityTypeBuilder<SalaryScale> builder)
    {
        builder.ToTable("SalaryScales");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Grade).HasMaxLength(50).IsRequired();
        builder.Property(x => x.MaximumSalary).HasPrecision(19, 4);
        builder.HasIndex(x => new { x.GazetteId, x.Code }).IsUnique();
        builder.HasMany(x => x.Points).WithOne().HasForeignKey(x => x.SalaryScaleId);
    }
}

public sealed class SalaryScalePointConfiguration : IEntityTypeConfiguration<SalaryScalePoint>
{
    public void Configure(EntityTypeBuilder<SalaryScalePoint> builder)
    {
        builder.ToTable("SalaryScalePoints");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Salary).HasPrecision(19, 4);
        builder.Property(x => x.IncrementAmount).HasPrecision(19, 4);
        builder.HasIndex(x => new { x.SalaryScaleId, x.PointNumber }).IsUnique();
    }
}
