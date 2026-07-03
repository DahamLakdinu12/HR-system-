#!/usr/bin/env python3

import unittest
from pathlib import Path

from import_salary_conversions import read_sections


class SalaryConversionWorkbookTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        project_root = Path(__file__).resolve().parents[2]
        workbook = (
            project_root
            / "Daham Aiya"
            / "Docs"
            / "Salary tables for IT.xlsx"
        )
        cls.rows, cls.stagnation_rows = read_sections(workbook)

    def test_imports_all_approved_salary_points(self) -> None:
        self.assertEqual(587, len(self.rows))

    def test_imports_all_grade_sections(self) -> None:
        self.assertEqual(24, len({row[0] for row in self.rows}))

    def test_marks_rows_above_approved_maximums_as_stagnation(self) -> None:
        self.assertEqual(158, self.stagnation_rows)
        self.assertEqual(158, sum(row[7] == "1" for row in self.rows))

    def test_imports_first_hm_salary_point(self) -> None:
        self.assertEqual(
            ["HM-2-3", "HM 2-3 - 2025", "1", "173000", "4850", "127650.5", "150325.25", "0"],
            self.rows[0],
        )

    def test_derives_missing_increment_value(self) -> None:
        first_jm_grade_two = next(
            row for row in self.rows if row[0] == "JM-1-1-II"
        )
        self.assertEqual("1", first_jm_grade_two[2])
        self.assertEqual("1360", first_jm_grade_two[4])

    def test_ignores_workbook_step_labels_and_renumbers_each_grade(self) -> None:
        for grade in {row[0] for row in self.rows}:
            rows = [row for row in self.rows if row[0] == grade]
            self.assertEqual(
                list(range(1, len(rows) + 1)),
                [int(row[2]) for row in rows],
            )

    def test_ma_two_two_grade_three_matches_pdf_scale(self) -> None:
        rows = [row for row in self.rows if row[0] == "MA-2-2-III"]
        self.assertEqual(19, len(rows))
        self.assertEqual("50540", rows[0][3])
        self.assertEqual("540", rows[0][4])
        self.assertEqual("60260", rows[-1][3])

    def test_multi_stage_increment_changes_after_first_six_years(self) -> None:
        rows = [row for row in self.rows if row[0] == "MA-1-2-II"]
        self.assertEqual("52250", rows[0][3])
        self.assertEqual("630", rows[0][4])
        self.assertEqual("630", rows[5][4])
        self.assertEqual("1080", rows[6][4])
        self.assertEqual("68990", rows[18][3])
        self.assertEqual("1080", rows[18][4])
        self.assertEqual("1", rows[19][7])


if __name__ == "__main__":
    unittest.main()
