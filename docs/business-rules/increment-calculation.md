# Increment Calculation Rules

## Approved HR salary conversion

For the HR staff data source, the system imports the approved employee workbook and
the salary conversion workbook into separate tables in the `HRStaff` database.

The approved conversion source is `Salary tables for IT.xlsx`. Its consolidated
`SalTables` worksheet contains 24 grade sections and these fields:

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

When approval updates the employee record, payable salary is rounded to the
nearest whole rupee using midpoint-away-from-zero, matching the source
workbook's column M convention.

The assessment form can only be generated when this complete match has status
`Applied`.

## Review cases

- `MaximumPoint`: the employee matches the final point in the assigned table.
  HR must review the stagnation allowance before generating the assessment.
- `Unmatched`: the grade is assigned but the current salary is not present in
  that table. No conversion or payable salary is invented.
- `Unavailable`: the selected data source has no approved conversion mapping.

Promotion handling, deferred increments, efficiency bars, leave effects, and
stagnation allowance decisions still require separately approved rules.
