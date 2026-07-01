# Increment Assessment and Approval Workflow

## States

1. An eligible employee begins in the increment queue.
2. `Move to assessment` creates a workflow snapshot with status
   `PendingApproval`. The employee is removed from increments and appears in
   both Assessments and Approvals.
3. `Not approved` changes the status to `Rejected`. The employee remains in
   Assessments and is removed from Approvals.
4. `Return to increments` changes the status to `ReturnedToIncrement`, making
   the employee eligible in the increment queue again.
5. `Approve` changes the status to `Approved` and advances the HR staff record.

## Approval database update

Approval is only supported for the approved `HRStaff` source. HCM remains
read-only.

The workflow status and employee update run in one SQL Server transaction. The
employee update:

- changes `SalaryPoint` to current salary plus the approved increment;
- advances `NextIncrementDate` by one year; and
- increments `NumberOfIncrements`.

The update succeeds only when pay code, current salary, and increment due date
still match the workflow snapshot. A stale record is rejected without changing
either database.

## Counts

Sidebar counts are loaded from the workflow API. Moving, rejecting, returning,
or approving dispatches a refresh so Increment, Assessment, and Approval counts
reflect the persisted state.
