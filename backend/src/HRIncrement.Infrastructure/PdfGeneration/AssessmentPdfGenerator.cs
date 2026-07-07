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
        return GenerateMany([assessment]);
    }

    public byte[] GenerateMany(IReadOnlyCollection<AssessmentFormDto> assessments)
    {
        ArgumentNullException.ThrowIfNull(assessments);
        if (assessments.Count == 0)
            throw new ArgumentException("At least one assessment is required.", nameof(assessments));

        return Document.Create(document =>
        {
            foreach (var assessment in assessments)
            {
                document.Page(page =>
                {
            var assessmentPeriodStart = assessment.IncrementDate.AddYears(-1);
            var leavePeriodEnd = assessment.IncrementDate.AddMonths(-1).AddDays(-1);
            var leavePeriodStart = leavePeriodEnd.AddYears(-1).AddDays(1);
            var previousYearEnd = new DateOnly(leavePeriodStart.Year, 12, 31);
            var currentYearStart = new DateOnly(leavePeriodEnd.Year, 1, 1);
            var showPayableSalary = assessment.IncrementDate.Year < 2027;

            page.Size(PageSizes.A4);
            page.MarginTop(22);
            page.MarginHorizontal(38);
            page.MarginBottom(30);
            page.DefaultTextStyle(x => x.FontSize(11));
            page.Header().Column(column =>
            {
                column.Item().Text("Part I ( To be filled by the HR Department)").FontSize(12);
                column.Item().AlignCenter().Text("Board of Investment of Sri Lanka").Bold().FontSize(16);
                column.Item().AlignCenter().Text("Performance Assessment (Junior Management)").FontSize(14);
                column.Item().PaddingTop(10).AlignCenter().Text(text =>
                {
                    text.Span("Period : From  ");
                    text.Span(assessmentPeriodStart.ToString("dd/MM/yyyy")).Bold();
                    text.Span(" to ");
                    text.Span(assessment.IncrementDate.ToString("dd/MM/yyyy")).Bold();
                });
                column.Item().PaddingTop(12).LineHorizontal(2).LineColor(Colors.Black);
            });

            page.Content().PaddingTop(28).Column(column =>
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
                        left.Item().PaddingTop(2).Text(Currency(assessment.PresentBasicSalary));
                        if (showPayableSalary)
                        {
                            left.Item().PaddingTop(14).Text("Payable Salary:");
                            left.Item().PaddingTop(2).Text(Currency(assessment.PresentPayableSalary));
                        }
                    });
                    row.RelativeItem().Column(center =>
                    {
                        center.Item().AlignCenter().Text("Amount of Increment due");
                        if (assessment.IsStagnationIncrement)
                            center.Item().AlignCenter().Text("(Stagnation)").Bold();
                        center.Item().PaddingTop(2).AlignCenter().Text(Currency(assessment.IncrementAmount));
                    });
                    row.RelativeItem().Column(right =>
                    {
                        right.Item().Text("Present salary plus Increment");
                        right.Item().PaddingTop(2).Text(Currency(assessment.ConvertedSalary));
                        if (showPayableSalary)
                        {
                            right.Item().PaddingTop(14).Text("Payable Salary:");
                            right.Item().PaddingTop(2).Text(Currency(assessment.PayableSalary));
                        }
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
                    row.ConstantItem(230).Text($"From  {leavePeriodStart:dd/MM/yyyy} - {leavePeriodEnd:dd/MM/yyyy}");
                });

                column.Item().PaddingTop(10).Table(table =>
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

                    table.Cell().Text($"Leave availed of in the previous year\n{leavePeriodStart:dd/MM/yyyy} - {previousYearEnd:dd/MM/yyyy}").FontSize(10);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);

                    table.Cell().Text($"Leave availed of in the current year\n{currentYearStart:dd/MM/yyyy} - {leavePeriodEnd:dd/MM/yyyy}").FontSize(10);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                    DotCell(table);
                });

                column.Item().PaddingTop(12).Text("* Please indicate whether Medical Certificates have been submitted.");
            });

            page.Footer().Row(row =>
            {
                row.RelativeItem().AlignBottom().Text(text =>
                {
                    text.Span(DateTime.Today.ToString("dddd, MMMM d, yyyy")).Bold().FontSize(9);
                });
                row.RelativeItem().AlignRight().Column(column =>
                {
                    column.Item().Text("Officer concerned in HR Department").Bold().FontSize(10);
                    column.Item().Text("for Executive Director (HR & Admin.)").Bold().FontSize(10);
                });
            });
                });
            }
        }).GeneratePdf();
    }

    private static void NumberedRow(
        ColumnDescriptor column,
        string number,
        string label,
        string value,
        string? secondLabel = null,
        string? secondValue = null) =>
        column.Item().PaddingBottom(10).Row(row =>
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
        column.Item().PaddingTop(10).Row(row =>
        {
            row.ConstantItem(32).Text(number);
            row.RelativeItem().Text(text);
        });

    private static void HeaderCell(TableDescriptor table, string text) =>
        table.Cell().AlignCenter().Text(text).Bold();

    private static void DotCell(TableDescriptor table) =>
        table.Cell().AlignCenter().Text("........");

    private static string Currency(decimal amount) =>
        $"Rs. {decimal.Round(amount, 0, MidpointRounding.AwayFromZero):N2}";
}
