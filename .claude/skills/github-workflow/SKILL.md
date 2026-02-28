---
name: github-workflow
description: Comprehensive GitHub workflow guide for complete issue-to-PR-to-merge cycle. Use when working on GitHub tasks including creating issues, writing commits, opening PRs, and following team conventions.
---

# GitHub Workflow Skill

Complete guide for professional GitHub workflows including issues, commits, pull requests, and best practices.

## Complete Workflow Cycle

### 1. Create Issue
**When**: Before starting any work
**Output**: GitHub issue with clear title, description, and acceptance criteria

**Process**:
```
Title: [Type]: Clear, specific description
Description: Problem, steps to reproduce, expected vs actual behavior
Labels: bug/feature/documentation/enhancement
Assignee: Yourself (or leave unassigned)
Milestone: Target version if known
```

**Use the `github-issue` skill** for comprehensive issue templates.

### 2. Create Feature Branch
**Naming convention**: `<type>/<short-description>`

```bash
# Format: type/feature-description
git checkout -b feat/auth-mfa
git checkout -b fix/memory-leak
git checkout -b docs/api-guide
git checkout -b refactor/auth-service
```

**Types match commit types**:
- `feat/` for features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for refactoring
- `perf/` for performance
- `test/` for tests
- `chore/` for maintenance

### 3. Make Commits
**Use the `github-commit` skill** for proper commit formatting

**Workflow**:
```bash
# Work on feature
git add .
git commit -m "feat(auth): add TOTP generation

Implement time-based one-time password generation
using industry standard TOTP algorithm.

Closes #1234"

# Make additional commits
git commit -m "feat(auth): add backup codes

Generate and store backup codes for account recovery
when authenticator app is unavailable.

Related to #1234"
```

**Commit Philosophy**:
- Small, logical changes
- Descriptive messages following conventional commits
- One feature per commit when possible
- Link to related issues

### 4. Create Pull Request
**Use the `github-pull-request` skill** for comprehensive PR description

**Process**:
```bash
# Push your branch
git push origin feat/auth-mfa

# Create PR on GitHub with:
# - Clear title and description
# - Link to related issues
# - Test evidence/screenshots
# - Review checklist completed
```

**PR Checklist**:
- [ ] Tests added/passing
- [ ] Documentation updated
- [ ] Code reviewed locally
- [ ] No breaking changes (or documented)
- [ ] Performance impact assessed
- [ ] Related issues linked

### 5. Code Review
**As author**:
- Respond to comments promptly
- Explain design decisions
- Don't take feedback personally
- Request re-review after changes

**As reviewer**:
- Be respectful and constructive
- Explain the why, not just what's wrong
- Approve when satisfied
- Use GitHub's "Request Changes" wisely

### 6. Merge and Close
**After approval**:
```bash
# Update branch if needed
git pull origin main
git push origin feat/auth-mfa

# Merge (GitHub UI or CLI)
gh pr merge --squash  # or --rebase, --merge

# Delete branch
git branch -d feat/auth-mfa
```

**Auto-closing issues**:
Use keywords in PR description to auto-close related issues:
- `Closes #123`
- `Fixes #456`
- `Resolves #789`
- `Related to #101`

## Issue Tracking Best Practices

### Issue Labels
Use consistent labeling:

- **Type**: `bug`, `feature`, `documentation`, `enhancement`
- **Priority**: `P0-critical`, `P1-high`, `P2-medium`, `P3-low`
- **Status**: `blocked`, `in-progress`, `ready-for-review`
- **Component**: `frontend`, `backend`, `database`, `infra`
- **Size**: `small`, `medium`, `large`, `epic`

### Issue Workflow
```
New → Assigned → In Progress → Ready for Review → Closed
                            ↑
                        (reopen if issues)
```

### Milestones
Organize work by:
- Version: `v1.2.0`
- Sprint: `Sprint 5`
- Phase: `MVP`, `Beta`, `General Release`

## Commit Message Examples by Use Case

### Starting a feature
```
feat(notifications): add email digest feature

Users can opt-in to receive weekly email digests
of their notifications instead of getting alerts
for each individual notification.
```

### Mid-feature additions
```
feat(notifications): add digest preferences UI

Add settings page where users can configure
digest frequency and notification types to include.
```

### Bug fixes during feature
```
fix(notifications): prevent duplicate email sends

Add unique constraint on digest send records
to prevent multiple emails sent in same digest.
```

### Completing feature
```
feat(notifications): implement email digest system

Complete implementation of email digest feature including:
- Digest generation and scheduling
- User preferences and settings
- Email template rendering
- Unsubscribe handling

Closes #2341
Related to #2301 #2302
```

## Team Collaboration

### Communication
- Use issue comments for discussions
- Link related issues
- @mention team members for visibility
- Keep comments professional and constructive

### Code Review Norms
```
PR opened
  → Assigned for review (24-48 hrs response)
    → Reviews complete
      → Minor changes (re-review in 24 hrs)
        → Approve
          → Merge
            → Close related issues
```

### Blocking Issues
For critical issues:
1. Mark as `P0-critical`
2. @mention relevant team
3. Add to milestone
4. Consider breaking into smaller issues

## Template Repository Structure

For teams, create issue templates:

```
.github/
  ├── ISSUE_TEMPLATE/
  │   ├── bug_report.md
  │   ├── feature_request.md
  │   └── documentation.md
  ├── PULL_REQUEST_TEMPLATE.md
  └── CONTRIBUTING.md
```

## Git Hygiene

### Before creating PR
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Rebase your branch
git checkout your-feature-branch
git rebase main

# Force push (only if you're alone on branch)
git push origin your-feature-branch --force-with-lease
```

### Squash strategy
Use squash when:
- Many small "fix" commits
- Experimental commits before refinement
- Want cleaner history

Keep separate commits when:
- Each commit is independently valuable
- Helps tell the story of changes
- Makes git blame more useful

## Security Practices

### In Issues
- Don't post secrets, API keys, passwords
- Don't include personal information
- Link to security advisories properly
- Use private discussions for sensitive issues

### In PRs
- Remove debug statements
- Remove temporary console.logs
- Check for secrets in code
- Review dependency changes
- Consider security implications

## Performance Considerations

### PR Size
- **Small**: 10-20 files, 100-300 lines
- **Medium**: 20-40 files, 300-800 lines
- **Large**: 40+ files, 800+ lines (reconsider splitting)

### Review Time
- Small PR: 1-2 hours review time
- Medium PR: 2-4 hours review time
- Large PR: Full day+ (should split)

## Automation Options

### GitHub Actions
Use CI/CD to automatically:
- Run tests on PR
- Check code style
- Run security scans
- Generate release notes

### Branch Protection Rules
Require:
- Passing CI checks
- Code reviews (1-2 minimum)
- Up-to-date branch
- No unresolved conversations

### Bots
Consider:
- Dependabot for dependencies
- Stale issue/PR closer
- Release automation
- Auto-merge for dependabot

## Common Workflows

### Bug Fix Workflow
1. Report issue with reproduction steps
2. Create `fix/` branch
3. Write failing test
4. Fix the bug
5. Verify test passes
6. PR with before/after evidence

### Feature Development
1. Create feature proposal issue
2. Discuss with team
3. Break into smaller issues if needed
4. Create `feat/` branch(es)
5. Develop with tests
6. Create PR with demo/screenshots
7. Merge after review

### Documentation Only
1. Create `docs/` branch
2. Update files
3. Have writing/tech lead review
4. Merge directly or via PR

## Troubleshooting

### Merge Conflicts
```bash
git pull origin main
# Fix conflicts in editor
git add .
git commit -m "chore: resolve merge conflicts"
git push origin your-branch
```

### Accidentally Committed to Main
```bash
git reset HEAD~1  # Undo last commit
git checkout -b your-feature-branch
git commit -m "your message"
```

### Need to Update PR
```bash
git add .
git commit -m "address review feedback"
git push origin your-branch
# Re-request review on GitHub
```

## Resources

- Use `github-issue` skill for issue templates
- Use `github-commit` skill for commit formatting
- Use `github-pull-request` skill for PR templates
- Check team CONTRIBUTING.md for specific conventions
- Review past merged PRs for style examples
