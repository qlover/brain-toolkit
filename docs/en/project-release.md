# Project Release Guide

This document provides detailed information about the release process, configuration, and best practices for the brain-toolkit project.

## 📋 Release Overview

brain-toolkit uses an automated release process based on the [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release) tool. The release process consists of three main steps:

1. **MergePR Stage** - Automatically detect package changes and add labels
2. **ReleasePR Stage** - Generate changelog and version numbers
3. **Release Stage** - Automatically publish to GitHub and npm

## 🔄 Detailed Release Process

### Step 1: Create Feature Branch and Pull Request

#### 1.1 Create Feature Branch

```bash
# Create feature branch from master
git checkout master
git pull origin master
git checkout -b feature/your-feature-name

# Perform development work
# ... modify code ...

# Commit changes (follow commit conventions)
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

> 💡 **Commit Convention**: Please refer to the [Commit Convention Guide](./commit-convention.md) for detailed commit message format requirements.

#### 1.2 Create Pull Request

Create a Pull Request on GitHub with `master` as the target branch.

#### 1.3 Add Version Increment Labels (Optional)

Add the following labels to the PR to control version number increments:

- `increment:major` - Major version increment (1.0.0 → 2.0.0)
- `increment:minor` - Minor version increment (1.0.0 → 1.1.0)  
- `increment:patch` - Patch version increment (1.0.0 → 1.0.1) **[Default]**

### Step 2: MergePR Automation

When the PR is merged into the master branch, GitHub Actions automatically performs the following operations:

#### 2.1 Detect Package Changes

The system automatically analyzes file changes in the `packages/` directory and adds labels for each modified package:

```
changes:packages/element-sizer
changes:packages/package-a
```

#### 2.2 Quality Checks

```bash
# Automatically executed check process
pnpm lint      # Code style check
pnpm test      # Run test suite
pnpm build     # Build all packages
```

#### 2.3 Generate ReleasePR

If all checks pass, the system will:
- Automatically generate changelog for each package
- Update version numbers
- Create ReleasePR

### Step 3: Publish to Repository

#### 3.1 Auto-merge ReleasePR

Based on the `autoMergeReleasePR` configuration in `fe-config.json`:

```json
{
  "release": {
    "autoMergeReleasePR": true  // Auto-merge ReleasePR
  }
}
```

#### 3.2 Publish to GitHub and npm

After ReleasePR is merged, the system automatically:
- Creates Git tags
- Publishes GitHub Release
- Publishes packages to npm registry

## ⚙️ Release Configuration

### fe-config.json Configuration Details

```json
{
  "protectedBranches": ["master", "develop"],
  "release": {
    "autoMergeReleasePR": true,
    "githubPR": {
      "commitArgs": ["--no-verify"],
      "pushChangedLabels": true
    },
    "changelog": {
      "formatTemplate": "\n- ${scopeHeader} ${commitlint.message} ${commitLink} ${prLink}",
      "commitBody": true,
      "types": [
        { "type": "feat", "section": "#### ✨ Features", "hidden": false },
        { "type": "fix", "section": "#### 🐞 Bug Fixes", "hidden": false },
        { "type": "docs", "section": "#### 📝 Documentation", "hidden": false },
        { "type": "refactor", "section": "#### ♻️ Refactors", "hidden": false },
        { "type": "perf", "section": "#### 🚀 Performance", "hidden": false },
        { "type": "build", "section": "#### 🚧 Build", "hidden": false },
        { "type": "chore", "section": "#### 🔧 Chores", "hidden": true },
        { "type": "test", "section": "#### 🚨 Tests", "hidden": true },
        { "type": "style", "section": "#### 🎨 Styles", "hidden": true },
        { "type": "ci", "section": "#### 🔄 CI", "hidden": true },
        { "type": "revert", "section": "#### ⏪ Reverts", "hidden": true },
        { "type": "release", "section": "#### 🔖 Releases", "hidden": true }
      ]
    }
  }
}
```

#### Configuration Options

- **protectedBranches**: List of protected branches
- **autoMergeReleasePR**: Whether to auto-merge ReleasePR
- **commitArgs**: Additional arguments for Git commits
- **pushChangedLabels**: Whether to push change labels
- **formatTemplate**: Changelog format template
- **types**: Commit type configuration, controls changelog grouping and display

### GitHub Actions Configuration

#### release.yml Workflow

```yaml
name: Release sub packages

on:
  pull_request:
    branches: [master]
    types: [closed]
    paths: [packages/**]

jobs:
  release-pull-request:
    # Execute when PR is merged and doesn't contain CI-Release label
    if: |
      github.event.pull_request.merged == true && 
      !contains(github.event.pull_request.labels.*.name, 'CI-Release')
    
  release:
    # Execute when PR is merged and contains CI-Release label
    if: |
      github.event.pull_request.merged == true && 
      contains(github.event.pull_request.labels.*.name, 'CI-Release')
```

### Environment Variables Configuration

Configure the following Secrets in GitHub repository settings:

```bash
# GitHub Personal Access Token (for creating PRs and Releases)
PAT_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# npm publish token (for publishing to npm)
NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx
```

## 📝 Commit Convention

### Conventional Commits

The project uses [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(element-sizer): add resize animation` |
| `fix` | Bug fix | `fix(element-sizer): resolve memory leak` |
| `docs` | Documentation update | `docs: update installation guide` |
| `refactor` | Code refactoring | `refactor: optimize animation logic` |
| `perf` | Performance optimization | `perf: improve resize calculation` |
| `test` | Test-related | `test: add unit tests for resizer` |
| `build` | Build-related | `build: update rollup config` |
| `ci` | CI/CD related | `ci: add release workflow` |
| `chore` | Other miscellaneous | `chore: update dependencies` |

#### Scope

- `element-sizer` - ElementSizer package related
- `docs` - Documentation related
- `config` - Configuration file related
- `deps` - Dependencies related

### Using Commitizen

The project is configured with Commitizen to help generate standardized commit messages:

```bash
# Use interactive commit
pnpm commit

# Or use git cz (if commitizen is globally installed)
git cz
```

## 🏷️ Label Management

### Automatic Labels

The system automatically adds labels for packages with changes:

```
changes:packages/element-sizer    # Package change label
increment:minor                   # Version increment label
CI-Release                       # Release label (automatically added by system)
```

### Manual Label Management

If a package doesn't need to be released, you can manually remove the corresponding `changes:` label:

1. Find the label on the GitHub PR page
2. Click the ❌ next to the label to remove it
3. That package will not be included in this release

## 📦 Package Release Strategy

### Independent Version Management

Each package has an independent version number, not affecting each other:

```
@brain-toolkit/element-sizer@1.2.0
@brain-toolkit/package-a@0.5.1
@brain-toolkit/package-b@2.1.0
```

### Dependency Relationship Handling

- **Internal Dependencies**: Inter-package dependencies automatically update version numbers
- **External Dependencies**: Need manual version range management

### Release Scope Control

You can control which packages participate in the release through labels:

```bash
# Only release element-sizer package
# Remove changes: labels for other packages, keep changes:packages/element-sizer
```

## 🔍 Release Status Monitoring

### GitHub Actions Status

View in the GitHub repository's Actions page:

- ✅ Build status
- ✅ Test results  
- ✅ Release status
- ❌ Failure reasons

### npm Release Status

Check if packages are successfully published to npm:

```bash
# Check package versions
npm view @brain-toolkit/element-sizer versions --json

# Check latest version
npm view @brain-toolkit/element-sizer version
```

### GitHub Release

View in the GitHub repository's Releases page:

- 📋 Release Notes
- 📦 List of published packages
- 🏷️ Git tags
- 📅 Release time

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failure

**Problem**: GitHub Actions build failure

**Solution**:
```bash
# Verify build locally
pnpm install
pnpm lint
pnpm test
pnpm build

# Check error logs
# Fix issues and resubmit
```

#### 2. Test Failure

**Problem**: Unit tests or integration tests fail

**Solution**:
```bash
# Run tests locally
pnpm test

# Run tests for specific package
pnpm --filter @brain-toolkit/element-sizer test

# View test coverage
pnpm test:coverage
```

#### 3. npm Publish Failure

**Problem**: Package publishing to npm fails

**Possible Causes**:
- npm token expired or invalid
- Package name exists and version number is duplicate
- Network connection issues

**Solution**:
```bash
# Check npm token
npm whoami

# Manual publish (if needed)
cd packages/element-sizer
npm publish

# Check if package name is available
npm view @brain-toolkit/element-sizer
```

#### 4. ReleasePR Not Auto-created

**Problem**: ReleasePR not created after merging PR

**Check Items**:
- Does PR contain changes to `packages/` directory
- Are GitHub Actions running normally
- Is PAT_TOKEN valid
- Are there `changes:` labels

#### 5. Incorrect Version Number

**Problem**: Generated version number doesn't meet expectations

**Solution**:
- Check `increment:` labels on PR
- Confirm commit messages follow [Conventional Commits specification](./commit-convention.md)
- Review changelog generation logic

#### 6. Non-compliant Commit Messages

**Problem**: Commit messages don't follow specification causing changelog generation errors

**Solution**:
- Refer to [Commit Convention Guide](./commit-convention.md)
- Use `pnpm commit` for interactive commits
- Modify commit history (if needed)

### Debugging Tips

#### 1. Local Release Simulation

```bash
# Install fe-release tool
npm install -g @qlover/fe-release

# Simulate release process (without actual release)
npx fe-release --dry-run -V

# View generated changelog
npx fe-release --dry-run --changelog-only
```

#### 2. View Detailed Logs

```bash
# Enable verbose logging
npx fe-release -V --verbose

# View GitHub Actions logs
# Check detailed execution logs in GitHub repository's Actions page
```

#### 3. Manual Release

If automatic release fails, you can execute manually:

```bash
# 1. Update version number
cd packages/element-sizer
npm version patch  # or minor/major

# 2. Generate changelog
npx fe-release --changelog-only

# 3. Commit changes
git add .
git commit -m "chore: release element-sizer@x.x.x"

# 4. Create tag
git tag @brain-toolkit/element-sizer@x.x.x

# 5. Push to remote
git push origin master --tags

# 6. Publish to npm
npm publish
```

## 🎯 Best Practices

### 1. Pre-release Checklist

- [ ] Code passes all tests
- [ ] Documentation is updated
- [ ] Commit messages follow [commit convention](./commit-convention.md)
- [ ] CHANGELOG format is correct
- [ ] Version numbers follow semantic versioning
- [ ] Dependencies are correctly configured

### 2. Version Management Strategy

- **Patch version**: Backward-compatible bug fixes
- **Minor version**: Backward-compatible new features
- **Major version**: Non-backward-compatible breaking changes

### 3. Release Timing

- **Regular releases**: Weekly or bi-weekly releases
- **Emergency fixes**: Important bug fixes released immediately
- **Feature releases**: Released after new features are completed

### 4. Rollback Strategy

If release issues occur, you can:

```bash
# 1. Unpublish npm package (within 24 hours)
npm unpublish @brain-toolkit/element-sizer@x.x.x

# 2. Publish fix version
npm version patch
npm publish

# 3. Update documentation explaining the issue
```

## 🔗 Related Links

- [Commit Convention Guide](./commit-convention.md)
- [@qlover/fe-release Documentation](https://www.npmjs.com/package/@qlover/fe-release)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

## 📞 Support

If you encounter issues during the release process:

1. Check [GitHub Issues](https://github.com/qlover/brain-toolkit/issues)
2. Review GitHub Actions execution logs
3. Contact project maintainers
4. Refer to [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release) documentation
