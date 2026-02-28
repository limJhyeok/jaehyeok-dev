---
name: github-issue
description: Generate well-structured GitHub issue titles and descriptions. Use when creating new issues, documenting bugs, or requesting features with professional formatting and clear acceptance criteria.
---

# GitHub Issue Skill

Generate professional GitHub issues with clear titles, detailed descriptions, and acceptance criteria.

## Issue Title Guidelines

- Keep titles concise (50-70 characters max)
- Start with action verb or category when applicable
- Examples:
  - `Fix: Login button not responding on mobile`
  - `Feature: Add dark mode toggle`
  - `Docs: Update API authentication guide`
  - `Bug: Memory leak in WebSocket handler`

## Issue Description Template

Use this structure for comprehensive issues:

```
## Description
[What is the issue? Clear, concise explanation]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Possible Solution
[Optional: your idea for fixing it]

## Environment
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node version: [if applicable]
- Package version: [if applicable]

## Screenshots/Logs
[Attach relevant screenshots or error logs]

## Related Issues
- Closes #[issue number]
- Related to #[issue number]

## Priority
[Low / Medium / High / Critical]
```

## Issue Types

### Bug Reports
- Lead with "Bug:" in title
- Include reproduction steps
- Show error messages/logs
- Specify affected versions

### Feature Requests
- Start title with "Feature:"
- Describe desired functionality
- Explain use case/benefit
- Suggest acceptance criteria

### Documentation
- Start with "Docs:" in title
- Specify what needs documenting
- Reference relevant code areas
- Suggest affected audiences

## Best Practices

1. **Search first**: Check if similar issue exists
2. **One issue, one problem**: Don't bundle multiple unrelated issues
3. **Use labels**: Mark as bug, feature, documentation, etc.
4. **Add milestones**: Assign target version when known
5. **Assign team members**: Tag relevant developers
6. **Link related work**: Reference related PRs or issues

## Example Issue

**Title**: `Bug: Form submission timeout after 30 seconds on slow networks`

**Description**:
```
## Description
Users on slow network connections (3G/4G) experience form submission timeouts after 30 seconds, even though the server is still processing the request.

## Steps to Reproduce
1. Open the contact form
2. Throttle network to 3G using DevTools
3. Fill out form fields
4. Click submit
5. Wait 30+ seconds

## Expected Behavior
Form should submit successfully or show a clear timeout message with retry option

## Actual Behavior
Form shows generic error after 30 seconds without attempting to retry

## Possible Solution
Increase client-side timeout from 30s to 60s and implement exponential backoff retry

## Environment
- OS: macOS 14.0
- Browser: Chrome 120
- Node: 18.17.0

## Related Issues
Closes #1234
```
