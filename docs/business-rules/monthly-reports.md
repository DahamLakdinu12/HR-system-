# Monthly HR Reports

## Increment register

The increment register uses the selected calendar month and the active employee
data source. It applies the same queue rule as the Increment page:

- employees due within the first and final day of the month are included;
- records already moved to assessment, rejected, or approved are excluded; and
- records explicitly returned to increments are included again.

The PDF contains employee identity, designation, grade, department, increment
date, salary point, current salary, increment amount, converted salary, and
payable salary.

## Approval outcomes

Every Approve or Not approved action creates an immutable
`WorkflowDecision` row. Monthly boundaries use Sri Lanka time
(`Asia/Colombo`), while decision timestamps remain stored in UTC.

The monthly PDF reports:

- accepted employees;
- declined employees;
- approval rate;
- all decision records with employee, salary, decision time, and actor.

A rejected employee can later return to increments without erasing the original
decline from the monthly report.
