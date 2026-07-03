# 2025 Salary Conversion Workbook

Source: `Salary tables for IT.xlsx`

The approved `SalTables` worksheet contains 24 salary-grade sections. The
importer verifies their progressions against `Salary Scale.pdf` and imports 429
normal points plus 158 employee-specific stagnation extension points. It does
not modify either source document.

## Imported fields

- Salary step
- New basic salary 2027
- New increment value
- Basic salary April 2025 (paid amount from 01.01.2025)
- Basic salary 2026

Employee current salaries are matched against the rounded 2025 paid amount or
the rounded 2026 basic salary in their assigned grade section. This supports
employees who are recorded at either approved payment stage.

## Source quality rules

Some sections leave `NewIncreValue` blank. For every normal salary point,
the importer derives that value from the difference between consecutive 2027
basic salaries. At a multi-stage boundary, this preserves the new rate declared
by the PDF. The official maximum and later stagnation points retain the final
increment rate.

Fourteen workbook sections continue above the maximum salary stated in
`Salary Scale.pdf`. The importer validates that all 158 rows continue using the
final increment, then marks them `IsStagnationPoint` so they cannot be applied
as ordinary grade progression.

Any missing section, duplicate section, unexpected salary step, changed header,
salary that disagrees with the PDF progression, or missing required salary
value causes the import to fail.
