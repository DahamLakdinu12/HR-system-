# 2025 Salary Conversion Workbook

Source: `Salary tables for IT.xlsx`

The approved `SalTables` worksheet contains 587 conversion points grouped into
24 salary-grade sections. The importer maps every section explicitly to the
grade codes in the HR staff workbook and does not modify the source workbook.

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

Some sections leave `NewIncreValue` blank. For every non-final salary point,
the importer derives that value from the difference between consecutive 2027
basic salaries. A final point without an explicit increment is stored with a
zero increment and remains a maximum-point review case.

Any missing section, duplicate section, unexpected salary step, changed header,
or missing required salary value causes the import to fail.
