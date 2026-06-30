using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HRIncrement.Infrastructure.PdfGeneration;

internal sealed class AssessmentPdfGenerator : IAssessmentPdfGenerator
{
    public byte[] Generate(AssessmentFormDto assessment)
    {
        ArgumentNullException.ThrowIfNull(assessment);

        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.MarginTop(22);
            page.MarginHorizontal(38);
            page.MarginBottom(24);
            page.DefaultTextStyle(x => x.FontSize(12));
            page.Header().Column(column =>
            {
                column.Item().Text("Part I ( To be filled by the HR Department)").FontSize(12);
                column.Item().AlignCenter().Text("Board of Investment of Sri Lanka").Bold().FontSize(16);
                column.Item().AlignCenter().Text("Performance Assessment (Junior Management)").FontSize(14);
                column.Item().PaddingTop(10).AlignCenter().Text(text =>
                {
                    text.Span("Period : From  ");
                    text.Span(assessment.AppointmentDate.AddYears(-1).ToString("dd/MM/yyyy")).Bold();
                    text.Span(" to ");
                    text.Span(assessment.IncrementDate.ToString("dd/MM/yyyy")).Bold();
                });
                column.Item().PaddingTop(12).LineHorizontal(2).LineColor(Colors.Black);
            });

            page.Content().PaddingTop(34).Column(column =>
            {
                NumberedRow(column, "1.", "Name of employee", assessment.EmployeeName);
                NumberedRow(column, "2.", "Pay Code No.", assessment.PayCode);
                NumberedRow(column, "3.", "Designation", assessment.Designation, "Grade", assessment.Grade);
                NumberedRow(column, "4.", "Date of Increment", assessment.IncrementDate.ToString("dd/MM/yyyy"));
                NumberedRow(column, "5.", "i) Date of appointment", assessment.AppointmentDate.ToString("dd/MM/yyyy"));
                NumberedRow(column, string.Empty, "ii) Date of promotion to the present grade", assessment.PromotionDate?.ToString("dd/MM/yyyy") ?? "................................");
                NumberedRow(column, "6.", "Department", assessment.Department, "Location", assessment.Location);
                NumberedRow(column, "7.", "Salary Scale", assessment.GazetteReference);

                column.Item().PaddingTop(8).Row(row =>
                {
                    row.ConstantItem(32).Text("8.");
                    row.RelativeItem().Column(left =>
                    {
                        left.Item().Text("Present Salary Point");
                        left.Item().PaddingTop(8).Text(
                            assessment.SalaryPoint is null
                                ? Currency(assessment.CurrentSalary)
                                : $"Step {assessment.SalaryPoint} / {Currency(assessment.CurrentSalary)}");
                    });
                    row.RelativeItem().Column(center =>
                    {
                        center.Item().Text("Amount of Increment due");
                        center.Item().PaddingTop(8).Text(Currency(assessment.IncrementAmount));
                    });
                    row.RelativeItem().Column(right =>
                    {
                        right.Item().Text("Present salary plus Increment");
                        right.Item().PaddingTop(8).Text(Currency(assessment.CurrentSalary + assessment.IncrementAmount));
                        right.Item().PaddingTop(8).Text("Converted Salary:");
                        right.Item().PaddingTop(8).Text(Currency(assessment.ConvertedSalary));
                        right.Item().PaddingTop(8).Text("Payable Salary:");
                        right.Item().PaddingTop(8).Text(Currency(assessment.PayableSalary));
                    });
                });

                LongQuestion(column, "9.", "Whether increment involves passing of Efficiency Bar. If so has the Officer qualified himself in all respect (Only for Clerical & Allied grades).");
                LongQuestion(column, "10.", "Whether increment for the previous year has been suspended, stopped or deferred.");
                column.Item().PaddingLeft(78).PaddingTop(2).Text("................................................................................................");
                NumberedRow(column, "11.", "Commendations/punishments during the increment period", string.Empty);

                column.Item().PaddingTop(22).Row(row =>
                {
                    row.ConstantItem(32).Text("12.");
                    row.RelativeItem().Text("Particulars of leave during the period :");
                    row.ConstantItem(230).Text($"From  {assessment.AppointmentDate.AddYears(-1):dd/MM/yyyy} - {assessment.IncrementDate.AddDays(-1):dd/MM/yyyy}");
                });

                column.Item().PaddingTop(14).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Cell().Text(string.Empty);
                    HeaderCell(table, "Casual");
                    HeaderCell(table, "Vacation");
                    HeaderCell(table, "*Sick");
                    HeaderCell(table, "*No-pay");
                    HeaderCell(table, "Late\nAttendance");

                    table.Cell().Text("Leave availed of in the previous year\n.................................").FontSize(11);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);

                    table.Cell().Text("Leave availed of in the current year\n.................................").FontSize(11);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                });

                column.Item().PaddingTop(20).Text("* Please indicate whether Medical Certificates have been submitted.");
            });

            page.Footer().AlignCenter().Text(text =>
            {
                text.Span(DateTime.Today.ToString("dddd, MMMM d, yyyy")).Bold().FontSize(9);
            });
        })).GeneratePdf();
    }

    private static void NumberedRow(
        ColumnDescriptor column,
        string number,
        string label,
        string value,
        string? secondLabel = null,
        string? secondValue = null) =>
        column.Item().PaddingBottom(14).Row(row =>
        {
            row.ConstantItem(32).Text(number);
            row.ConstantItem(160).Text(label);
            row.ConstantItem(20).Text(":");
            row.RelativeItem().Text(value);

            if (!string.IsNullOrWhiteSpace(secondLabel))
            {
                row.ConstantItem(70).Text(secondLabel);
                row.ConstantItem(14).Text(":");
                row.ConstantItem(90).Text(secondValue ?? string.Empty);
            }
        });

    private static void LongQuestion(ColumnDescriptor column, string number, string text) =>
        column.Item().PaddingTop(14).Row(row =>
        {
            row.ConstantItem(32).Text(number);
            row.RelativeItem().Text(text);
        });

    private static void HeaderCell(TableDescriptor table, string text) =>
        table.Cell().AlignCenter().Text(text).Bold();

    private static void DotCell(TableDescriptor table) =>
        table.Cell().AlignCenter().Text("........");

    private static string Currency(decimal amount) => $"Rs. {amount:N2}";
}
