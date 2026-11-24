# Code Debugging Skill

## Purpose
Provides systematic approaches to identify, isolate, and resolve bugs in the codebase.

## Principles
- **Reproduce First**: Always reproduce the bug before attempting to fix
- **Isolate Variables**: Use binary search to narrow down the root cause
- **Verify Fix**: Confirm the fix resolves the issue without regressions
- **Document Findings**: Record the bug, root cause, and fix for future reference

## Debugging Process

### 1. Understand the Problem
- Read error messages carefully
- Check logs and stack traces
- Identify the expected vs actual behavior
- Note environment details (OS, Node version, browser)

### 2. Reproduce Consistently
- Create minimal reproduction steps
- Document exact inputs that trigger the bug
- Test in different environments if applicable

### 3. Isolate the Root Cause
- Use binary search on recent changes (git bisect)
- Add strategic logging/breakpoints
- Check common sources:
  - Race conditions in async code
  - State management issues
  - API contract mismatches
  - Type coercion bugs
  - Off-by-one errors

### 4. Implement Fix
- Make minimal, targeted changes
- Follow existing code patterns
- Add test coverage for the fix
- Verify no regressions

### 5. Verify & Document
- Run existing test suite
- Test edge cases
- Update documentation if needed
- Add to team knowledge base

## Tools & Techniques
- **VS Code Debugger**: Breakpoints, watch expressions, call stack
- **React DevTools**: Component props, state, hooks
- **Network Tab**: API requests/responses, timing
- **Console Logging**: Strategic `console.log` with context
- **Git Bisect**: Find breaking commit
- **Error Boundaries**: Catch React render errors

## Common Patterns in This Codebase
- **Frontend**: Check `buildPageContent.js` for data transformation bugs
- **Backend**: Verify permission checks in `siteDataController.js`
- **Database**: Check migration scripts and seed data
- **API**: Validate request/response shapes match contracts

## Checklist Before Closing Bug
- [ ] Bug reproduced and understood
- [ ] Root cause identified
- [ ] Fix implemented with minimal change
- [ ] Tests pass (existing + new)
- [ ] No regressions introduced
- [ ] Documentation updated
- [ ] Team notified if critical