# Increment Calculation Rules

## Approved HR salary conversion

For the HR staff data source, the system imports the approved employee workbook and
the salary conversion workbook into separate tables in the `HRStaff` database.

The approved conversion source is `Salary tables for IT.xlsx`. Its consolidated
`SalTables` worksheet contains 24 grade sections. `Salary Scale.pdf` defines
the permitted starting salary, annual increments, increment counts, and maximum
salary for those sections.

- Salary step
- New basic salary 2027
- New increment value
- Basic salary April 2025 (paid amount from 01.01.2025)
- Basic salary 2026

An employee is matched to a conversion point using:

1. The employee's `NewGrade` assigned to the corresponding salary section.
2. The current salary from employee workbook column M matched to the rounded
   2025 paid amount or rounded 2026 basic salary.

For a matched employee with a following point:

- `Salary point` is the matched worksheet row.
- `Current salary` is parsed from column M, labelled `NearestPolice` in the
  source workbook and supplied by HR as `Payable 2026`. Values use the
  `PS <amount>` format.
- If column M does not contain a valid `PS <amount>`, the importer falls back
  to column I and reports the number of affected rows for HR review.
- `Increment amount` is the current point's new increment value. Where the
  workbook leaves it blank, the importer derives it from consecutive 2027
  basic salary points.
- `Converted salary` is the next point's new 2027 basic salary.
- `Payable salary` is the next point's 2026 basic salary.

Multi-stage scales change increment rate at the declared boundary. For example,
`MA-1-2-II` starts at 52,250, uses 630 for the first six annual transitions,
then uses 1,080 for the following twelve transitions to reach 68,990.

When approval updates the employee record, payable salary is rounded to the
nearest whole rupee using midpoint-away-from-zero, matching the source
workbook's column M convention.

Rows above a PDF-defined maximum are marked as stagnation extension points,
not normal grade steps. They continue using the final increment rate. An
employee at the official maximum receives `MaximumPoint`; an employee already
on an extension receives `Stagnation`.

`Applied` employees follow the normal scale automatically. `MaximumPoint` and
`Stagnation` employees require HR to select **Authorize stagnation increment**
for that individual assessment. They are excluded from bulk selection.

## Review cases

- `MaximumPoint`: the employee matches the final point in the assigned table.
  HR must explicitly authorize the final-rate stagnation increment.
- `Stagnation`: the employee is already beyond the normal maximum. HR must
  explicitly authorize each further annual stagnation increment.
- `Unmatched`: the grade is assigned but the current salary is not present in
  that table. No conversion or payable salary is invented.
- `Unavailable`: the selected data source has no approved conversion mapping.

Promotion handling, deferred increments, efficiency bars, and leave effects
still require separately approved rules.
