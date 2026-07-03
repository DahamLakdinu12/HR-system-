#!/usr/bin/env python3

import unittest

from import_hr_staff import clean_basic_salary_2027, clean_payable_salary


class PayableSalaryTests(unittest.TestCase):
    def test_parses_ps_prefixed_salary(self) -> None:
        self.assertEqual("74536", clean_payable_salary("PS 74536"))

    def test_parses_comma_separated_salary(self) -> None:
        self.assertEqual("103027.00", clean_payable_salary("PS 103,027.00"))

    def test_parses_numeric_salary(self) -> None:
        self.assertEqual("77826", clean_payable_salary(77826))

    def test_rejects_legacy_police_station_text(self) -> None:
        self.assertEqual("", clean_payable_salary("KATUNAYAKE."))


class BasicSalary2027Tests(unittest.TestCase):
    def test_parses_bs_prefixed_salary(self) -> None:
        self.assertEqual("95770", clean_basic_salary_2027("BS 95770"))

    def test_parses_numeric_salary(self) -> None:
        self.assertEqual("137190", clean_basic_salary_2027(137190))

    def test_rejects_legacy_epf_text(self) -> None:
        self.assertEqual("", clean_basic_salary_2027("XXXXXXXXXXXXX"))


if __name__ == "__main__":
    unittest.main()
