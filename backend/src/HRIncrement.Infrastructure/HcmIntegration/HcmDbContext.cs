using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HcmDbContext(DbContextOptions<HcmDbContext> options) : DbContext(options)
{
    public DbSet<HcmEmployeeRow> Employees => Set<HcmEmployeeRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
        => ConfigureEmployeeView(modelBuilder);

    internal static void ConfigureEmployeeView(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HcmEmployeeRow>(builder =>
        {
            builder.HasNoKey();
            builder.ToView("vw_HRIncrementEmployees");
            builder.Property(x => x.EmployeeNumber).HasColumnName("EmployeeNumber");
            builder.Property(x => x.CurrentSalary).HasPrecision(19, 4);
            builder.Property(x => x.IncrementAmount).HasPrecision(19, 4);
            builder.Property(x => x.StagnationAllowance).HasPrecision(19, 4);
        });
    }
}

internal sealed class HrStaffDbContext(DbContextOptions<HrStaffDbContext> options) : DbContext(options)
{
    public DbSet<HcmEmployeeRow> Employees => Set<HcmEmployeeRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
        => HcmDbContext.ConfigureEmployeeView(modelBuilder);
}

internal sealed class HcmEmployeeRow
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
    public decimal IncrementAmount { get; init; }
    public decimal StagnationAllowance { get; init; }
    public string SalaryScale { get; init; } = string.Empty;
}
