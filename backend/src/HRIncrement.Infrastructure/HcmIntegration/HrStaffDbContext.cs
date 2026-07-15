using HRIncrement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HrStaffDbContext(DbContextOptions<HrStaffDbContext> options) : DbContext(options)
{
    public DbSet<HrStaffEmployeeRow> Employees => Set<HrStaffEmployeeRow>();
    public DbSet<EmployeeHistoryEntry> EmployeeHistoryEntries => Set<EmployeeHistoryEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HrStaffEmployeeRow>(builder =>
        {
            builder.HasNoKey();
            builder.ToView("vw_HRIncrementEmployees");
            builder.Property(x => x.EmployeeNumber).HasColumnName("EmployeeNumber");
            builder.Property(x => x.CurrentSalary).HasPrecision(19, 4);
            builder.Property(x => x.PresentBasicSalary).HasPrecision(19, 4);
            builder.Property(x => x.PresentPayableSalary).HasPrecision(19, 4);
            builder.Property(x => x.IncrementAmount).HasPrecision(19, 4);
            builder.Property(x => x.ConvertedSalary).HasPrecision(19, 4);
            builder.Property(x => x.PayableSalary).HasPrecision(19, 4);
            builder.Property(x => x.StagnationAllowance).HasPrecision(19, 4);
        });

        modelBuilder.Entity<EmployeeHistoryEntry>(builder =>
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
        });
    }
}

internal sealed class HrStaffEmployeeRow
{
    public string EmployeeNumber { get; init; } = string.Empty;
    public string PayCode { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Designation { get; init; } = string.Empty;
    public string Grade { get; init; } = string.Empty;
    public string Department { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public DateOnly AppointmentDate { get; init; }
    public DateOnly? PromotionDate { get; init; }
    public DateOnly? IncrementDate { get; init; }
    public decimal CurrentSalary { get; init; }
    public decimal PresentBasicSalary { get; init; }
    public decimal PresentPayableSalary { get; init; }
    public int? SalaryPoint { get; init; }
    public decimal IncrementAmount { get; init; }
    public decimal ConvertedSalary { get; init; }
    public decimal PayableSalary { get; init; }
    public decimal StagnationAllowance { get; init; }
    public string SalaryScale { get; init; } = string.Empty;
    public string SalaryConversionStatus { get; init; } = string.Empty;
}
