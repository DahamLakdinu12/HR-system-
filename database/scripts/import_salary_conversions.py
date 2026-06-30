#!/usr/bin/env python3
"""Convert the approved salary conversion workbook into a SQL bulk-import file."""

from __future__ import annotations

import argparse
import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from openpyxl import load_workbook


# Employee grade codes come from the approved staff workbook. Some source sheet
# names use "G" or "1-2" labels that do not match those codes, so the assignment
# is explicit rather than relying on fragile text normalization.
GRADE_SHEETS = {
    "PL-1-III": "PL 1 -2025- G III",
    "PL-1-II": "PL  1 -2025- G II",
    "PL-1-I": "PL 1 -2025- G I",
    "PL-2-III": "PL 2 -2025- G III",
    "PL-2-II": "PL 2 -2025- G II",
    "PL-2-I": "PL 2 -2025- G I",
    "PL-3-III": "PL 3 -2025 - G III",
    "PL-3-II": "PL 3 -2025- G II",
    "PL-3-I": "PL 3 -2025- G I",
    "MA-1-1": "MA 1 - 1- G II",
    "MA-2-2-III": "MA 2 -2-G III",
    "MA-2-2-II": "MA 2 -2-G II",
    "MA-2-2-I": "MA 2 -2-G I",
    "MA-1-2-III": "MA 1-2-G III",
    "MA-1-2-II": "MA1-2 G II",
    "MA-1-2-I": "MA 1-2-G I",
    "JM-1-1-II": "JM 1-2-G II",
    "JM-1-1-I": "JM 1-2-G I",
    "MM-1-1-II": "MM 1-1-G II",
    "MM-1-1-I": "MM 1-1-G I",
    "HM-1-1": "HM-1-1",
    "HM-1-3": "HM1-3",
    "HM-2-1": "HM 2-1",
    "HM-2-3": "HM 2-3",
}


def decimal_value(value: object, sheet: str, row: int, column: str) -> str:
    if value is None:
        raise ValueError(f"{sheet} row {row}: {column} is required")
    try:
        return format(Decimal(str(value).replace(",", "")), "f")
    except InvalidOperation as error:
        raise ValueError(
            f"{sheet} row {row}: invalid {column} value {value!r}"
        ) from error


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    workbook = load_workbook(args.workbook, data_only=True, read_only=True)
    missing_sheets = set(GRADE_SHEETS.values()) - set(workbook.sheetnames)
    if missing_sheets:
        raise ValueError(f"Missing salary conversion sheets: {sorted(missing_sheets)}")

    imported_rows = 0
    corrected_steps = 0
    corrected_paid_salaries = 0
    args.output.parent.mkdir(parents=True, exist_ok=True)

    with args.output.open("w", encoding="utf-8", newline="") as output:
        writer = csv.writer(
            output,
            delimiter="\t",
            quoting=csv.QUOTE_MINIMAL,
            lineterminator="\n",
        )

        for grade_code, sheet_name in GRADE_SHEETS.items():
            worksheet = workbook[sheet_name]
            seen_steps: set[int] = set()
            previous_step: int | None = None

            for row_number, row in enumerate(
                worksheet.iter_rows(min_row=5, values_only=True), start=5
            ):
                if row[0] is None:
                    continue

                try:
                    reported_step = int(Decimal(str(row[0])))
                except (InvalidOperation, ValueError) as error:
                    raise ValueError(
                        f"{sheet_name} row {row_number}: invalid salary step {row[0]!r}"
                    ) from error

                salary_step = reported_step
                if previous_step is not None and reported_step != previous_step + 1:
                    if sheet_name == "PL 3 -2025 - G III" and reported_step == 19:
                        salary_step = previous_step + 1
                        corrected_steps += 1
                    else:
                        raise ValueError(
                            f"{sheet_name} row {row_number}: expected salary step "
                            f"{previous_step + 1}, found {reported_step}"
                        )

                if salary_step in seen_steps:
                    raise ValueError(
                        f"{sheet_name}: duplicate salary step {salary_step}"
                    )
                seen_steps.add(salary_step)
                previous_step = salary_step
                paid_salary_2027 = row[9]
                if (
                    paid_salary_2027 is None
                    and sheet_name == "MA 2 -2-G II"
                    and salary_step == 19
                    and Decimal(str(row[8])) == 0
                ):
                    paid_salary_2027 = row[5]
                    corrected_paid_salaries += 1

                writer.writerow(
                    [
                        grade_code,
                        sheet_name,
                        salary_step,
                        decimal_value(row[1], sheet_name, row_number, "2024 salary"),
                        decimal_value(row[2], sheet_name, row_number, "2025 basic salary"),
                        decimal_value(row[3], sheet_name, row_number, "2025 unpaid amount"),
                        decimal_value(row[4], sheet_name, row_number, "2025 paid salary"),
                        decimal_value(row[5], sheet_name, row_number, "2026 basic salary"),
                        decimal_value(row[6], sheet_name, row_number, "2026 unpaid amount"),
                        decimal_value(row[7], sheet_name, row_number, "2026 paid salary"),
                        decimal_value(row[8], sheet_name, row_number, "2027 unpaid amount"),
                        decimal_value(
                            paid_salary_2027,
                            sheet_name,
                            row_number,
                            "2027 paid salary",
                        ),
                    ]
                )
                imported_rows += 1

    print(
        f"Imported {imported_rows} salary points assigned to "
        f"{len(GRADE_SHEETS)} employee grades."
    )
    if corrected_steps:
        print(
            f"Corrected {corrected_steps} repeated salary-step labels in "
            "'PL 3 -2025 - G III' using their sequential row order."
        )
    if corrected_paid_salaries:
        print(
            "Filled the missing 2027 paid salary for 'MA 2 -2-G II' step 19 "
            "from its 2026 basic salary because the 2027 unpaid amount is zero."
        )


if __name__ == "__main__":
    main()
