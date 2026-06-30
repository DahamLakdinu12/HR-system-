# 2025 Salary Conversion Workbook

Source: `Salary Conversion Table (1).xlsx`

The importer stores all 474 conversion points and explicitly assigns the 24
worksheets to employee grade codes. It does not modify the source workbook.

## Source quality notes

Two visible spreadsheet defects are corrected deterministically during import:

1. In `PL 3 -2025 - G III`, rows after the first step 19 repeat the label 19.
   Their salaries continue in a regular sequence, so the importer assigns steps
   20 through 37 by row order and reports all 18 corrections.
2. In `MA 2 -2-G II`, step 19 has a blank 2027 paid salary, a zero 2027 unpaid
   amount, and a populated 2026 basic salary. The importer uses that basic
   salary as the full 2027 paid salary and reports the correction.

Any other missing value, duplicate point, unexpected step, or missing worksheet
causes the import to fail.
