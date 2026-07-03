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
        cls.rows = read_sections(workbook)

    def test_imports_all_approved_salary_points(self) -> None:
        self.assertEqual(587, len(self.rows))

    def test_imports_all_grade_sections(self) -> None:
        self.assertEqual(24, len({row[0] for row in self.rows}))

    def test_imports_first_hm_salary_point(self) -> None:
        self.assertEqual(
            ["HM-2-3", "HM 2-3 - 2025", "1", "173000", "4850", "127650.5", "150325.25"],
            self.rows[0],
        )

    def test_derives_missing_increment_value(self) -> None:
        first_jm_grade_two = next(
            row for row in self.rows if row[0] == "JM-1-1-II"
        )
        self.assertEqual("1360", first_jm_grade_two[4])


if __name__ == "__main__":
    unittest.main()
