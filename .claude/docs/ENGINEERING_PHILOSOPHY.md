# Problem Solving & Debugging Philosophy

## 1. Root Cause First
Fix the cause, not symptoms. Don't add `if (!data) return null` on frontend — fix why API didn't return data or why `@athlo/shared` type doesn't match reality.

## 2. Source-of-Truth Fix
Fix at the owner layer: DB schema issues → fix SQL/seed, not add frontend mapping. API contract issues → fix backend service, not add data transformations.

## 3. End-to-End Research
Investigate from both directions before fixing:
* **Top-down**: Route → Page → Container → State
* **Bottom-up**: DB → API → Service → Hook → UI

## 4. Layered Diagnosis
Check problems in order: (1) Contracts in `@athlo/shared`, (2) NestJS business logic, (3) Async/race conditions in React Query, (4) UI state handling, (5) Layer integration