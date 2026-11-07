# Specification: [Feature Name]
*Q.E.D. Specification Template*

## 1. Problem Statement & Context
*What problem does this solve? Why does the user care? What is the current limitation?*

## 2. User Stories & Scenarios
- **Scenario 1**: Given [context], when [user performs action], then [expected outcome].
- **Scenario 2**: Given [context], when [failure or edge condition], then [graceful fallback].

## 3. The 4 Mandatory UI & Data States
- **Empty State**: What displays when 0 items or no data exists?
- **Loading State**: How is async loading conveyed (skeleton, spinner)?
- **Error State**: Actionable error message and retry mechanism.
- **Degraded / Offline State**: What happens if the network drops or timeout occurs?

## 4. Blast Radius Assessment
- **Direct Dependents**: [Files, routes, or callers touched]
- **Indirect Impact**: [Database schema, external APIs, auth tokens]
- **Risk Level**: [Low | Medium | Critical]

## 5. Binary Acceptance Criteria
- [ ] Criterion 1 (Pass/Fail)
- [ ] Criterion 2 (Pass/Fail)
- [ ] Criterion 3 (Pass/Fail)
