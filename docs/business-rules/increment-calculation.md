# Increment Calculation Rules

## Approved HR salary conversion

For the HR staff data source, the system imports the approved employee workbook and
the salary conversion workbook into separate tables in the `HRStaff` database.

An employee is matched to a conversion point using:

1. The employee's `NewGrade` assigned to a specific conversion worksheet.
2. The employee's current `SalaryPoint` matched exactly to the worksheet's
   `As at 2024.12.31 Basic Salary`.

For a matched employee with a following point:

- `Salary point` is the matched worksheet row.
- `Current salary` is the employee's 2024 basic salary.
- `Increment amount` is the next point's 2024 salary minus the current point's
  2024 salary.
- `Converted salary` is the next point's 2026 basic salary.
- `Payable salary` is the next point's 2026 paid salary.

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
