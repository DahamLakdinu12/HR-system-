using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRIncrement.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIncrementWorkflowSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeIncrements_EmployeeNumber_DueDate",
                table: "EmployeeIncrements");

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "EmployeeIncrements",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "EmployeeIncrements",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                table: "EmployeeIncrements",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeName",
                table: "EmployeeIncrements",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Grade",
                table: "EmployeeIncrements",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "EmployeeIncrements",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PayCode",
                table: "EmployeeIncrements",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeIncrements_EmployeeNumber_DueDate_DataSource",
                table: "EmployeeIncrements",
                columns: new[] { "EmployeeNumber", "DueDate", "DataSource" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeIncrements_EmployeeNumber_DueDate_DataSource",
                table: "EmployeeIncrements");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "EmployeeIncrements");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "EmployeeIncrements");

            migrationBuilder.DropColumn(
                name: "Designation",
                table: "EmployeeIncrements");

            migrationBuilder.DropColumn(
                name: "EmployeeName",
                table: "EmployeeIncrements");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "EmployeeIncrements");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "EmployeeIncrements");

            migrationBuilder.DropColumn(
                name: "PayCode",
                table: "EmployeeIncrements");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeIncrements_EmployeeNumber_DueDate",
                table: "EmployeeIncrements",
                columns: new[] { "EmployeeNumber", "DueDate" });
        }
    }
}
