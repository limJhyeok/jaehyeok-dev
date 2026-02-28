---
name: github-commit
description: Generate well-formatted commit messages following conventional commits standard. Use when creating commit messages that are clear, searchable, and follow team conventions (feat, fix, docs, style, refactor, perf, test, chore).
---

# GitHub Commit Message Skill

Generate professional, searchable commit messages following the Conventional Commits standard.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, or tooling

## Guidelines

### Subject Line
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period (.) at the end
- Limit to 50 characters max
- Reference issues when relevant: `fix: prevent racing condition (#123)`

### Body
- Wrap at 72 characters
- Explain **what** and **why**, not how
- Separate from subject with blank line
- Include motivation for the change
- Contrast with previous behavior

### Footer
- Reference issue tracker IDs: `Closes #123`
- Break changes: `BREAKING CHANGE: description`
- Multiple entries: one per line

## Commit Types with Examples

### Feature Commits
```
feat(auth): add JWT token refresh mechanism

Implement automatic token refresh before expiration
to improve user experience by reducing login prompts.

Closes #456
```

### Bug Fix Commits
```
fix(api): handle null responses in user endpoint

Add proper null checks to prevent 500 errors
when user profile data is missing from database.

Fixes #789
```

### Documentation Commits
```
docs(readme): add setup instructions for macOS

Include brew install commands and m1 compatibility notes
for developers setting up the project on Apple Silicon.
```

### Refactor Commits
```
refactor(database): extract connection logic to service

Move database initialization logic into separate DatabaseService
class for better testability and reusability across modules.
```

### Performance Commits
```
perf(search): implement query result caching

Cache search results for 5 minutes to reduce database queries
and improve response time for common searches by 60%.

Closes #234
```

### Test Commits
```
test(checkout): add integration tests for payment flow

Add comprehensive tests covering successful payments,
failed transactions, and edge cases like network timeouts.
```

### Chore Commits
```
chore(deps): upgrade react to 18.2.0

Update React and related packages to latest stable versions
to get latest performance improvements and bug fixes.
```

## Best Practices

1. **Atomic commits**: One logical change per commit
2. **Test before committing**: Ensure tests pass
3. **Clear messages**: Others should understand why, not what code does
4. **Link to issues**: Reference issue numbers in footer
5. **Break changes clearly**: Use BREAKING CHANGE footer
6. **Use proper scopes**: `(auth)`, `(api)`, `(ui)`, etc.

## Common Scopes

- `auth` - Authentication related
- `api` - API endpoints
- `db` - Database operations
- `ui` - User interface
- `core` - Core functionality
- `docs` - Documentation
- `test` - Test files
- `config` - Configuration files
- `deps` - Dependencies

## Anti-Patterns to Avoid

```
❌ git commit -m "fixed stuff"
❌ git commit -m "UPDATED CODE"
❌ git commit -m "blah"
❌ git commit -m "1"
```

Use these instead:

```
✅ fix(auth): correct password reset token expiration
✅ refactor(api): simplify user endpoint response structure
✅ docs: update contribution guidelines
```

## Commit Emoji Convention (Optional)

Some teams use emoji prefixes for quick visual scanning:

- 🎉 Initial commit: `git commit -m "🎉 initial commit"`
- ✨ New feature: `git commit -m "✨ feat(auth): add SSO"`
- 🐛 Bug fix: `git commit -m "🐛 fix(api): null check"`
- 📝 Docs: `git commit -m "📝 docs: update readme"`
- ♻️ Refactor: `git commit -m "♻️ refactor(db): extract service"`
- ⚡ Perf: `git commit -m "⚡ perf(search): add caching"`
- ✅ Tests: `git commit -m "✅ test(checkout): add cases"`
- 🔧 Chore: `git commit -m "🔧 chore(deps): upgrade React"`
