using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRIncrement.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowDecisionHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkflowDecisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeIncrementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Approved = table.Column<bool>(type: "bit", nullable: false),
                    DecidedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DecidedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowDecisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowDecisions_EmployeeIncrements_EmployeeIncrementId",
                        column: x => x.EmployeeIncrementId,
                        principalTable: "EmployeeIncrements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowDecisions_DecidedAtUtc",
                table: "WorkflowDecisions",
                column: "DecidedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowDecisions_EmployeeIncrementId_DecidedAtUtc",
                table: "WorkflowDecisions",
                columns: new[] { "EmployeeIncrementId", "DecidedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkflowDecisions");
        }
    }
}
