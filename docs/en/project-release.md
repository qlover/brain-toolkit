# Project Release Guide

This guide describes brain-toolkit’s automated release flow based on [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release) **5.x** (aligned with fe-base).

## Overview

```
feature/*  ──PR──►  master  ──fe-release──►  release/*  ──PR──►  master  ──►  npm
                 (+ preRelease)              (+ CI-Release)
```

| Phase | Trigger | What happens |
| --- | --- | --- |
| 1. Feature PR | PR → `master` | `general-check`: lint / test / build / type-check |
| 2. Create Release PR | Merge to `master` with **`preRelease`** (or manual `workflow_dispatch`) | Detect changed packages, bump versions, write changelogs, open `release/*` PR |
| 3. Publish | `release/*` → `master` with **`CI-Release`** | `changeset publish`, push tags, create GitHub Releases |

> Do **not** put `CI-Release` on feature PRs. Use **`preRelease`** when you want a release.

## Release Process

### 1. Feature branch and PR

```bash
git checkout master
git pull origin master
git checkout -b feature/your-feature-name

# Develop and commit with Conventional Commits
git add .
pnpm commit   # or: git commit -m "feat(brain-user): ..."
git push origin feature/your-feature-name
```

Open a PR targeting `master`. `general-check` runs quality gates automatically.

### 2. Labels before merge

| Label | Who adds it | Purpose |
| --- | --- | --- |
| `preRelease` | **Manual** (on feature PR) | After merge, triggers “create Release PR” |
| `increment:major` / `increment:minor` / `increment:patch` | Optional | Override default patch bump |
| `CI-Release` | **Auto** (on `release/*` PR) | Marks the release PR; merge triggers publish |

Changed packages are detected via **git diff** (against the PR base SHA). `changes:*` labels are **not** required.

### 3. Create Release PR

After a `preRelease`-labeled feature PR merges into `master`, `release.yml` → `create-release-pr`:

1. Build, type-check, lint, test
2. Runs:

```bash
npx fe-release -V -s master -i <increment> \
  --workspaces.compare-ref <PR_BASE_SHA> \
  --changesetVersion.ignore-non-updated-packages
```

3. Pushes `release/<repo>-<id>` and opens a Release PR labeled `CI-Release`

You can also run **Release sub packages** manually (`workflow_dispatch`) without `preRelease`.

### 4. Merge Release PR and publish

When `release/*` + `CI-Release` merges into `master`, the `publish` job runs:

```bash
npx fe-release -V \
  --workspaces.compare-ref <PR_BASE_SHA> \
  --changesetVersion.skip-changeset \
  --changesetVersion.mode publish \
  --github.mode createRelease \
  --github.ignore-release-paths examples,apps
```

This publishes to npm, pushes git tags, and creates GitHub Releases per package (skipping `examples` / `apps`).

If `github.autoMergeReleasePR` is `true` in `fe-config.json`, the Release PR may be merged automatically after creation.

## Configuration

### fe-config.json

```json
{
  "protectedBranches": ["master", "develop"],
  "release": {
    "changesetVersion": {
      "changesetRoot": ".changeset",
      "ignoreNonUpdatedPackages": false,
      "dependencyReleaseTemplate": "- Update dependency **${name}** from `${oldVersion}` to `${newVersion}`",
      "formatTemplate": "\n- ${scopeHeader} ${commitlint.message} ${commitLink} ${prLink}",
      "commitBody": true
    },
    "github": {
      "autoMergeReleasePR": true,
      "pushChangeLabels": true,
      "commitArgs": ["--no-verify"],
      "ignoreReleasePaths": ["examples", "apps"]
    }
  }
}
```

| Option | Meaning |
| --- | --- |
| `changesetVersion.*` | Changesets root, dependency changelog template, commit format / types |
| `github.autoMergeReleasePR` | Auto-merge the Release PR |
| `github.pushChangeLabels` | Attach change labels to the Release PR |
| `github.commitArgs` | Extra git commit args (e.g. `--no-verify`) |
| `github.ignoreReleasePaths` | Path prefixes skipped for GitHub Releases |

### GitHub Secrets

- `PAT_TOKEN` — create PRs / push tags / GitHub Releases
- `NPM_TOKEN` — publish to npm

### Scripts

```bash
pnpm build:packages:force   # force-build packages (exclude examples)
pnpm test:force             # full test run
pnpm release:branch         # local: bump + push release branch (no PR)
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/). See [Commit Convention](./commit-convention.md).

```bash
pnpm commit
```

| Type | Use | Example |
| --- | --- | --- |
| `feat` | Feature | `feat(element-sizer): add resize animation` |
| `fix` | Bug fix | `fix(brain-user): resolve otp verify` |
| `docs` | Docs | `docs: update release guide` |
| `refactor` / `perf` / `build` | Refactor / perf / build | … |
| `chore` / `test` / `ci` | Chore / test / CI (hidden in changelog by default) | … |

## Package Strategy

- Independent versions per package (e.g. `@brain-toolkit/element-sizer@1.2.0`)
- Internal deps are bumped by Changesets
- `examples` and `apps` skip GitHub Releases; the release workflow path filter is `packages/**`

## Troubleshooting

### Release PR was not created

Check:

- Feature PR had **`preRelease`** before merge
- Changes touched `packages/**`
- Head is not already `release/*`
- `PAT_TOKEN` is valid and Actions succeeded

### Unexpected version bump

- Check `increment:major` / `increment:minor` / `increment:patch`
- Confirm commits follow Conventional Commits

### Local debugging

```bash
npx fe-release --dry-run -V -s master \
  --changesetVersion.ignore-non-updated-packages

pnpm release:branch
```

### Build / test / npm failures

```bash
pnpm install
pnpm type-check
pnpm lint
pnpm test:force
pnpm build:packages:force

npm whoami
npm view @brain-toolkit/element-sizer version
```

## Best Practices

- Add `preRelease` on the feature PR **before** merge when a release is needed
- Use `increment:major` for breaking changes
- Run type-check / lint / test / build locally first
- For hotfixes: merge with `preRelease`, or use `workflow_dispatch` to cut a Release PR from current `master`

## Related Links

- [Commit Convention](./commit-convention.md)
- [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
