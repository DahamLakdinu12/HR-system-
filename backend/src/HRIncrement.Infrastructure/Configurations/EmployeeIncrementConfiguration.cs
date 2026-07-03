using HRIncrement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRIncrement.Infrastructure.Configurations;

public sealed class EmployeeIncrementConfiguration : IEntityTypeConfiguration<EmployeeIncrement>
{
    public void Configure(EntityTypeBuilder<EmployeeIncrement> builder)
    {
        builder.ToTable("EmployeeIncrements");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EmployeeNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.PayCode).HasMaxLength(50).IsRequired();
        builder.Property(x => x.EmployeeName).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Designation).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Grade).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Department).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Location).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DataSource).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasIndex(x => new { x.EmployeeNumber, x.DueDate, x.DataSource }).IsUnique();
        builder.HasIndex(x => x.Status);

        builder.OwnsOne(x => x.Calculation, calculation =>
        {
            calculation.Property(x => x.CurrentSalary).HasColumnName("CurrentSalary").HasPrecision(19, 4);
            calculation.Property(x => x.SalaryPoint).HasColumnName("SalaryPoint");
            calculation.Property(x => x.IncrementAmount).HasColumnName("IncrementAmount").HasPrecision(19, 4);
            calculation.Property(x => x.ConvertedSalary).HasColumnName("ConvertedSalary").HasPrecision(19, 4);
            calculation.Property(x => x.PayableSalary).HasColumnName("PayableSalary").HasPrecision(19, 4);
            calculation.Property(x => x.StagnationAllowance).HasColumnName("StagnationAllowance").HasPrecision(19, 4);
            calculation.Property(x => x.CalculatedAtUtc).HasColumnName("CalculatedAtUtc");
            calculation.Property(x => x.IsStagnationIncrement).HasColumnName("IsStagnationIncrement");
        });
    }
}
