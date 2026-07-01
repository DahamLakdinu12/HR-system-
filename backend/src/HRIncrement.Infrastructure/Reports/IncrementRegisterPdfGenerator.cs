using HRIncrement.Application.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HRIncrement.Infrastructure.Reports;

internal static class IncrementRegisterPdfGenerator
{
    public static byte[] Generate(
        string monthLabel,
        string sourceLabel,
        IReadOnlyList<IncrementRegisterRowDto> rows) =>
        Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4.Landscape());
            page.Margin(24);
            page.DefaultTextStyle(style => style.FontSize(8));
            page.Header().Column(column =>
            {
                column.Item().Text("Board of Investment of Sri Lanka").Bold().FontSize(16);
                column.Item().Text($"Monthly Increment Register - {monthLabel}").Bold().FontSize(12);
                column.Item().Text($"Source: {sourceLabel} | Employees: {rows.Count}")
                    .FontColor(Colors.Grey.Darken1);
            });

            page.Content().PaddingTop(14).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(42);
                    columns.RelativeColumn(1.6f);
                    columns.RelativeColumn(1.4f);
                    columns.ConstantColumn(48);
                    columns.RelativeColumn();
                    columns.ConstantColumn(55);
                    columns.ConstantColumn(57);
                    columns.ConstantColumn(57);
                    columns.ConstantColumn(57);
                });

                table.Header(header =>
                {
                    Header(header, "Pay code");
                    Header(header, "Employee");
                    Header(header, "Designation / Grade");
                    Header(header, "Date");
                    Header(header, "Department");
                    Header(header, "Current");
                    Header(header, "Increment");
                    Header(header, "Converted");
                    Header(header, "Payable");
                });

                foreach (var row in rows)
                {
                    Cell(table, row.PayCode);
                    Cell(table, row.EmployeeName);
                    Cell(table, $"{row.Designation}\n{row.Grade}");
                    Cell(table, row.IncrementDate.ToString("dd/MM/yyyy"));
                    Cell(table, row.Department);
                    Money(table, row.CurrentSalary);
                    Money(table, row.IncrementAmount);
                    Money(table, row.ConvertedSalary);
                    Money(table, row.PayableSalary);
                }

                if (rows.Count == 0)
                    table.Cell().ColumnSpan(9).Padding(18).AlignCenter()
                        .Text("No increment employees found for this month.");
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

    private static void Header(TableDescriptor table, string text) =>
        table.Cell().Background(Colors.Green.Darken3).Padding(5)
            .Text(text).SemiBold().FontColor(Colors.White);

    private static void Cell(TableDescriptor table, string text) =>
        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(text);

    private static void Money(TableDescriptor table, decimal amount) =>
        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4)
            .AlignRight().Text($"{amount:N0}");
}
