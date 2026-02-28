---
name: pair-programming-workflow
description: >
  Enforces a pair-programming workflow where Claude proposes changes in
  meaningful, minimal units (single-commit size), explains the plan before
  coding, and waits for developer confirmation between steps. Use this skill
  for ANY code modification task — feature additions, bug fixes, refactors,
  migrations, or dependency updates. Triggers whenever the developer asks
  Claude to write, edit, fix, add, remove, or refactor code in this project.
---

# Pair Programming Workflow

## Core Rule

Every change must be **one logical Git commit** — large enough to be
self-contained, small enough to review in under 3 minutes.

### Size Calibration

Too small (avoid):
- Adding an import with no usage
- Creating a migration without touching the model
- Scaffolding an empty component

Too large (avoid):
- Refactoring 10+ files at once
- Implementing an entire feature in one shot

Right size:
- One API endpoint: route + schema + CRUD + test
- One bug fix + regression test
- One model column + migration + related CRUD updates
- One frontend component + API integration

## Workflow

1. **Plan first** — Before any code, briefly list what will change and in
   what order. Wait for confirmation.
2. **One step at a time** — After each step, show the result and stop.
   Proceed only after developer says go.
3. **Each step must be green** — Build passes, existing tests pass.
4. **Split large tasks** — Break multi-file features into meaningful stages.

## Bundling Rules (never separate these)

- Model changes ↔ database migrations (always same step)
- `pyproject.toml` / `package.json` changes ↔ lock file updates
- New dependency ↔ the code that uses it

## Self-Check Before Every Change

Before presenting a change, verify:
1. Single clear objective?
2. Build succeeds with only this change?
3. Existing tests still pass?
4. Diff reviewable in ≤ 3 minutes?
5. Developer confirmed previous step?

## Exceptions

- **Urgent bug fixes**: Multiple files OK, but explain scope first.
- **Initial scaffolding**: May be larger if it's all boilerplate. Still explain before starting.
