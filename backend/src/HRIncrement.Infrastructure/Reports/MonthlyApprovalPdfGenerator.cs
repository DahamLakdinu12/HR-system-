using HRIncrement.Application.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HRIncrement.Infrastructure.Reports;

internal static class MonthlyApprovalPdfGenerator
{
    public static byte[] Generate(
        string monthLabel,
        string sourceLabel,
        IReadOnlyList<ApprovalDecisionRowDto> rows)
    {
        var approved = rows.Where(row => row.Approved)
            .Select(row => row.PayCode).Distinct().Count();
        var declined = rows.Where(row => !row.Approved)
            .Select(row => row.PayCode).Distinct().Count();
        var decided = approved + declined;
        var approvalRate = decided == 0 ? 0 : decimal.Round(approved * 100m / decided, 1);

        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4.Landscape());
            page.Margin(28);
            page.DefaultTextStyle(style => style.FontSize(9));
            page.Header().Column(column =>
            {
                column.Item().Text("Board of Investment of Sri Lanka").Bold().FontSize(16);
                column.Item().Text($"Monthly Increment Approval Report - {monthLabel}")
                    .Bold().FontSize(12);
                column.Item().Text($"Source: {sourceLabel}")
                    .FontColor(Colors.Grey.Darken1);
            });

            page.Content().PaddingTop(14).Column(column =>
            {
                column.Item().Row(row =>
                {
                    Summary(row, "Accepted", approved.ToString(), Colors.Green.Darken2);
                    Summary(row, "Declined", declined.ToString(), Colors.Orange.Darken2);
                    Summary(row, "Approval rate", $"{approvalRate:N1}%", Colors.Blue.Darken2);
                    Summary(row, "Decision records", rows.Count.ToString(), Colors.Grey.Darken2);
                });

                column.Item().PaddingTop(16).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(45);
                        columns.RelativeColumn(1.6f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn();
                        columns.ConstantColumn(55);
                        columns.ConstantColumn(62);
                        columns.ConstantColumn(62);
                        columns.ConstantColumn(58);
                        columns.ConstantColumn(72);
                    });

                    table.Header(header =>
                    {
                        Header(header, "Pay code");
                        Header(header, "Employee");
                        Header(header, "Designation / Grade");
                        Header(header, "Department");
                        Header(header, "Increment");
                        Header(header, "Payable");
                        Header(header, "Decision");
                        Header(header, "Date");
                        Header(header, "Decided by");
                    });

                    foreach (var decision in rows)
                    {
                        Cell(table, decision.PayCode);
                        Cell(table, decision.EmployeeName);
                        Cell(table, $"{decision.Designation}\n{decision.Grade}");
                        Cell(table, decision.Department);
                        Money(table, decision.IncrementAmount);
                        Money(table, decision.PayableSalary);
                        Decision(table, decision.Approved);
                        Cell(table, decision.DecidedAtUtc.ToOffset(TimeSpan.FromHours(5.5))
                            .ToString("dd/MM/yyyy HH:mm"));
                        Cell(table, decision.DecidedBy);
                    }

                    if (rows.Count == 0)
                        table.Cell().ColumnSpan(9).Padding(18).AlignCenter()
                            .Text("No approval decisions were recorded for this month.");
                });
            });

            page.Footer().Row(row =>
            {
                row.RelativeItem().Text($"Generated {DateTimeOffset.Now:dd/MM/yyyy HH:mm}");
                row.RelativeItem().AlignRight().Text(text =>
                {
                    text.Span("Page ");
                    text.CurrentPageNumber();
                    text.Span(" of ");
                    text.TotalPages();
                });
            });
        })).GeneratePdf();
    }

    private static void Summary(
        RowDescriptor row,
        string label,
        string value,
        string color) =>
        row.RelativeItem().PaddingRight(8).Border(1).BorderColor(Colors.Grey.Lighten2)
            .Padding(10).Column(column =>
            {
                column.Item().Text(label).FontColor(Colors.Grey.Darken1);
                column.Item().Text(value).Bold().FontSize(18).FontColor(color);
            });

    private static void Header(TableCellDescriptor table, string text) =>
        table.Cell().Background(Colors.Green.Darken3).Padding(5)
            .Text(text).SemiBold().FontColor(Colors.White);

    private static void Cell(TableDescriptor table, string text) =>
        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(text);

    private static void Money(TableDescriptor table, decimal amount) =>
        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
            .AlignRight().Text($"{amount:N0}");

    private static void Decision(TableDescriptor table, bool approved) =>
        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
            .Text(approved ? "Accepted" : "Declined")
            .SemiBold()
            .FontColor(approved ? Colors.Green.Darken2 : Colors.Orange.Darken2);
}
