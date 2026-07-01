using HRIncrement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Gazette> Gazettes => Set<Gazette>();
    public DbSet<SalaryScale> SalaryScales => Set<SalaryScale>();
    public DbSet<SalaryScalePoint> SalaryScalePoints => Set<SalaryScalePoint>();
    public DbSet<EmployeeIncrement> EmployeeIncrements => Set<EmployeeIncrement>();
    public DbSet<WorkflowDecision> WorkflowDecisions => Set<WorkflowDecision>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
}
