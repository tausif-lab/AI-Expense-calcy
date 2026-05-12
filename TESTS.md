# TESTS.md

## Automated Testing Overview

The project uses Vitest to validate the audit engine logic automatically. The tests focus specifically on the core recommendation and savings calculation system because the audit engine is the most important business logic in the application.

All tests are located in:

```text id="ts1"
tests/audit-engine.test.ts
```

Run all tests locally using:

```bash id="ts2"
npm run test
```

Or directly with Vitest:

```bash id="ts3"
npx vitest
```

---

# Test File

## tests/audit-engine.test.ts

This file contains automated tests for the audit engine and recommendation logic.

---

## Test Coverage

### 1. Team Plan Overkill Detection

Covers:

* Detecting when users are paying for expensive team plans unnecessarily
* Example: Claude Team with fewer than the required seats

Checks:

* downgrade recommendation
* savings calculation
* plan mismatch detection

---

### 2. Unused Seat Detection

Covers:

* detecting inactive or wasted seats
* calculating wasted monthly spend

Checks:

* unused seat tagging
* correct savings calculation
* seat reduction recommendations

---

### 3. Duplicate Tool Overlap Detection

Covers:

* overlapping AI tooling
* redundant subscriptions

Examples:

* Cursor + Windsurf
* Claude + ChatGPT for similar writing workflows

Checks:

* redundancy detection
* consolidation recommendations

---

### 4. Annual Billing Optimization

Covers:

* identifying monthly billing inefficiencies
* suggesting annual billing where savings exist

Checks:

* annual billing recommendation
* estimated billing-cycle savings

---

### 5. Already-Optimized Stack Validation

Covers:

* ensuring the engine does not manufacture fake savings
* validating optimized configurations

Checks:

* zero savings behavior
* optimized status reporting

---

## Bonus Tests

Additional tests validate:

* high-savings detection
* aggregate savings calculations
* annual savings consistency
* overall savings math integrity

---

# Continuous Integration

The project includes a GitHub Actions CI workflow located at:

```text id="ts4"
.github/workflows/ci.yml
```

The CI pipeline automatically runs:

* ESLint
* Vitest test suite

on every push to the `main` branch.

This ensures:

* audit logic remains stable
* regressions are caught automatically
* recommendation calculations remain reliable

---

# Current Test Status

Current automated test suite:

```text id="ts5"
12 tests passing
1 test file passing
```

The test suite validates both standard and edge-case audit scenarios for the recommendation engine.
