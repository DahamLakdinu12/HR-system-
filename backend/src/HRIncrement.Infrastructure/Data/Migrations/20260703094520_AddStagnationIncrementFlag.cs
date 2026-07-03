using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRIncrement.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStagnationIncrementFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsStagnationIncrement",
                table: "EmployeeIncrements",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsStagnationIncrement",
                table: "EmployeeIncrements");
        }
    }
}
