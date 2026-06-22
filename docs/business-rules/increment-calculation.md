# Increment Calculation Baseline

## Implemented rule boundary

The initial calculation engine accepts a salary point, converted salary, increment amount,
maximum salary, and stagnation eligibility. It calculates:

1. `uncapped salary = converted salary + increment amount`
2. `payable salary = min(uncapped salary, maximum salary)`
3. `stagnation allowance = max(0, uncapped salary - maximum salary)` when eligible
4. Monetary results are rounded to two decimals using `AwayFromZero`.

## Required business validation

This baseline is not a substitute for the government gazette. Before production, HR and
Finance must approve documented rules for conversion-point selection, promotion handling,
effective dates, no-pay periods, deferred increments, maximum-step behavior, stagnation
frequency, and statutory rounding. Each approved rule set must be versioned and historical
calculation inputs and outputs must remain immutable.
