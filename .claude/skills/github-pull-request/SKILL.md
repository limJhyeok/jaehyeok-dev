---
name: github-pull-request
description: Generate professional GitHub pull request titles and detailed descriptions. Use when creating PRs with clear change summaries, testing notes, and review guidance for code reviewers.
---

# GitHub Pull Request Skill

Create professional pull requests with clear titles, comprehensive descriptions, and reviewer guidance.

## PR Title Guidelines

- Use format: `[Type]: Brief description`
- Keep concise (60-80 characters)
- Types: Feature, Fix, Refactor, Docs, Performance, Tests, Chore
- Examples:
  - `Feature: Add two-factor authentication`
  - `Fix: Resolve memory leak in WebSocket connection`
  - `Refactor: Extract auth logic to separate service`
  - `Performance: Optimize database queries with indexing`

## PR Description Template

Use this comprehensive template:

```markdown
## Description
[What changes are being made and why? Keep it clear and concise.]

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issues
Closes #[issue number]
Related to #[issue number]

## Changes Made
- [Change 1]
- [Change 2]
- [Change 3]

## Testing
### Test Plan
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

### How to Test
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Test Results
[What did you test? What were the results?]

## Breaking Changes
[If applicable, describe what breaks and migration path]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Screenshots/Videos
[If UI changes: add screenshots or screen recordings]

## Performance Impact
[Any performance implications? Positive or negative?]

## Deployment Notes
[Special deployment steps or configuration changes needed?]

## Reviewers
@[reviewer1] @[reviewer2]
```

## PR Types and Examples

### Feature PR
```markdown
## Description
Implements two-factor authentication (2FA) for user accounts,
allowing users to enable TOTP-based verification on login.

## Related Issues
Closes #1234

## Changes Made
- Add TOTP secret generation and verification
- Create 2FA settings page in user account
- Add backup codes generation and recovery
- Update login flow to verify 2FA when enabled

## Testing
- [ ] Unit tests for TOTP validation (8 tests added)
- [ ] Integration tests for login flow (5 tests added)
- [ ] Manual testing: Setup 2FA, login with code, test backup codes

### How to Test
1. Go to Settings > Security
2. Click "Enable Two-Factor Authentication"
3. Scan QR code with Authenticator app
4. Enter verification code
5. Save backup codes
6. Logout and login again
7. Verify 2FA prompt appears

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Tests added and passing
- [x] Documentation updated
- [x] No new warnings

@john-reviewer @security-team
```

### Fix PR
```markdown
## Description
Fixes a critical memory leak in the WebSocket connection handler
where listeners weren't being properly cleaned up on disconnect.

## Related Issues
Fixes #5678

## Root Cause
The `disconnect` event listener was referencing a closure
that wasn't being garbage collected, preventing memory cleanup.

## Solution
Moved listener cleanup to a dedicated method called
when the connection closes, ensuring all event listeners
are properly removed.

## Testing
### Test Plan
- [x] Memory profiling before/after
- [x] Unit tests for cleanup (3 tests added)
- [x] Load test with 1000 concurrent connections

### Test Results
- Memory usage decreased from 450MB to 120MB under load
- No leaks detected in 1-hour stress test
- All existing tests still pass

## Checklist
- [x] Bug reproduction confirmed
- [x] Fix verified locally
- [x] Tests pass
- [x] No performance regression

@devops-team
```

### Refactor PR
```markdown
## Description
Extracts authentication logic from middleware into
a dedicated AuthService class for better testability
and separation of concerns.

## Changes Made
- Create new AuthService class with static methods
- Move JWT validation logic from middleware
- Update middleware to use AuthService
- Add comprehensive unit tests for AuthService

## Impact
- Reduces middleware complexity
- Improves code reusability
- Makes testing auth logic easier
- No breaking changes for other modules

## Testing
- [x] All 47 existing tests pass
- [x] 12 new unit tests added for AuthService
- [x] Middleware behavior unchanged

## Checklist
- [x] Code review ready
- [x] No API changes
- [x] Tests comprehensive
- [x] Backwards compatible
```

### Documentation PR
```markdown
## Description
Comprehensive documentation for the new Database
Connection Pool API with examples and troubleshooting.

## Files Updated
- docs/api/connection-pool.md (new)
- docs/guides/database-setup.md (updated)
- README.md (minor update)

## Content Includes
- Connection pool configuration options
- Code examples (Node.js, Python, Go)
- Performance tuning guide
- Common issues and solutions
- Migration guide from old API

## Checklist
- [x] Spelling and grammar checked
- [x] Code examples tested
- [x] Links verified
- [x] Formatting consistent
```

## PR Review Checklist for Authors

Before submitting:

1. **Code Quality**
   - [ ] No console.log/debug statements
   - [ ] No commented-out code
   - [ ] No TODO comments without context
   - [ ] Code follows project style guide

2. **Testing**
   - [ ] All tests passing locally
   - [ ] Coverage not decreased
   - [ ] Edge cases covered

3. **Documentation**
   - [ ] Code comments for complex logic
   - [ ] README updated if needed
   - [ ] API docs updated if needed
   - [ ] Breaking changes documented

4. **Best Practices**
   - [ ] No hardcoded values
   - [ ] Proper error handling
   - [ ] No security issues
   - [ ] Performance implications considered

## Tips for Better PRs

1. **Keep them focused**: One feature or fix per PR
2. **Write clear titles**: Reviewers see these immediately
3. **Describe the why**: Not just the what
4. **Include test evidence**: Show test results
5. **Link related issues**: Makes tracking easier
6. **Request reviewers**: Tag relevant team members
7. **Be responsive**: Answer review comments quickly
8. **Use drafts**: Mark as draft if not ready for review

## Commit Message in PR

Use conventional commit format in branch name and PR title:

```
feat/auth-mfa        → Feature: Add multi-factor authentication
fix/memory-leak       → Fix: Resolve memory leak in WebSocket
docs/setup-guide     → Docs: Add local development setup guide
refactor/auth-service → Refactor: Extract auth logic to service
```

## Common PR Pitfalls to Avoid

❌ "Updated stuff"
❌ PR with 50 files changed
❌ Missing test evidence
❌ No description
❌ Vague "will explain in comments" messages
❌ Too many unrelated changes

✅ Clear title and description
✅ Focused changes (10-20 files max)
✅ Screenshots/test results
✅ Comprehensive testing notes
✅ Related issues referenced
✅ One logical change per PR
