using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRIncrement.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [Migration("20260715084500_AddEmployeeHistoryEntries")]
    public partial class AddEmployeeHistoryEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmployeeHistoryEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PayCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DataSource = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Actor = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EffectiveDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EmployeeIncrementId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IncrementDueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    FieldName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    PreviousValue = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    NewValue = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PreviousSalaryPoint = table.Column<int>(type: "int", nullable: true),
                    NewSalaryPoint = table.Column<int>(type: "int", nullable: true),
                    PreviousSalary = table.Column<decimal>(type: "decimal(19,4)", precision: 19, scale: 4, nullable: true),
                    NewSalary = table.Column<decimal>(type: "decimal(19,4)", precision: 19, scale: 4, nullable: true),
                    IncrementAmount = table.Column<decimal>(type: "decimal(19,4)", precision: 19, scale: 4, nullable: true),
                    PreviousGrade = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    NewGrade = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeHistoryEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeHistoryEntries_EmployeeIncrementId",
                table: "EmployeeHistoryEntries",
                column: "EmployeeIncrementId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeHistoryEntries_EmployeeNumber_OccurredAtUtc",
                table: "EmployeeHistoryEntries",
                columns: new[] { "EmployeeNumber", "OccurredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeHistoryEntries_PayCode_OccurredAtUtc",
                table: "EmployeeHistoryEntries",
                columns: new[] { "PayCode", "OccurredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeeHistoryEntries");
        }
    }
}
