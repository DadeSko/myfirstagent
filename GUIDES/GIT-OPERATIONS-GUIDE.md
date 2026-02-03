# 🔧 Git Operations Tool Guide

Complete guide to using the `git_operations` tool in the agent.

## Overview

The Git Operations tool provides essential Git functionality directly from the agent, allowing you to manage version control without leaving the agentic workflow.

## Supported Operations

### 1. Status - Check Repository State

```typescript
{
  operation: "status"
}
```

**Example:**
```bash
npx ts-node agent.ts "Show git status"
```

**Returns:**
- List of modified files
- Staged files
- Untracked files
- Or "Working tree clean" if no changes

### 2. Add - Stage Files

```typescript
{
  operation: "add",
  files: ["."]  // Stage all files
}

{
  operation: "add",
  files: ["src/index.ts", "README.md"]  // Stage specific files
}
```

**Examples:**
```bash
npx ts-node agent.ts "Stage all changes"
npx ts-node agent.ts "Stage the README.md file"
npx ts-node agent.ts "Add tools/primitives/git-operations.ts to staging"
```

**Returns:**
- Confirmation of staged files

### 3. Commit - Create Commit

```typescript
{
  operation: "commit",
  message: "feat: add git operations tool"
}
```

**Examples:**
```bash
npx ts-node agent.ts "Commit changes with message 'fix: resolve bug in parser'"
npx ts-node agent.ts "Create commit: docs: update README"
```

**Returns:**
- Commit hash
- Files changed
- Insertions/deletions

**Note:** Follows conventional commits format recommended.

### 4. Push - Push to Remote

```typescript
{
  operation: "push"
}
```

**Examples:**
```bash
npx ts-node agent.ts "Push commits to origin"
npx ts-node agent.ts "Push changes"
```

**Returns:**
- Remote branch updated
- Objects pushed
- Commit range

### 5. Pull - Pull from Remote

```typescript
{
  operation: "pull"
}
```

**Examples:**
```bash
npx ts-node agent.ts "Pull latest changes"
npx ts-node agent.ts "Update from remote"
```

**Returns:**
- Files updated
- Merge status
- New commits

### 6. Log - View Commit History

```typescript
{
  operation: "log",
  limit: 10  // Optional, defaults to 10
}
```

**Examples:**
```bash
npx ts-node agent.ts "Show last 5 commits"
npx ts-node agent.ts "Show commit history"
```

**Returns:**
- Commit hashes (short)
- Commit messages
- Branch decorations

### 7. Diff - Show Changes

```typescript
{
  operation: "diff"
}
```

**Examples:**
```bash
npx ts-node agent.ts "Show uncommitted changes"
npx ts-node agent.ts "What did I change?"
```

**Returns:**
- File diffs
- Line-by-line changes
- Added/removed content

### 8. Branch - List or Create Branches

```typescript
// List branches
{
  operation: "branch"
}

// Create new branch
{
  operation: "branch",
  branch: "feature/new-feature"
}
```

**Examples:**
```bash
npx ts-node agent.ts "List all branches"
npx ts-node agent.ts "Create branch feature/git-ops"
```

**Returns:**
- List of local branches (marked with * for current)
- Or confirmation of new branch creation

### 9. Checkout - Switch Branches

```typescript
{
  operation: "checkout",
  branch: "main"
}
```

**Examples:**
```bash
npx ts-node agent.ts "Switch to main branch"
npx ts-node agent.ts "Checkout develop"
```

**Returns:**
- Confirmation of branch switch
- Files updated

### 10. Init - Initialize Repository

```typescript
{
  operation: "init"
}
```

**Examples:**
```bash
npx ts-node agent.ts "Initialize git repository"
npx ts-node agent.ts "Create new git repo"
```

**Returns:**
- Confirmation of repository initialization

## Common Workflows

### Workflow 1: Check Status and Commit Changes

```bash
# Check what changed
npx ts-node agent.ts "Show git status and diff"

# Stage and commit
npx ts-node agent.ts "Stage all files and commit with message 'feat: implement feature'"

# Push to remote
npx ts-node agent.ts "Push to origin"
```

### Workflow 2: Create Feature Branch

```bash
# Create and switch to new branch
npx ts-node agent.ts "Create branch feature/new-tool and switch to it"

# Make changes...

# Commit and push
npx ts-node agent.ts "Stage changes, commit with message 'feat: add new tool', and push"
```

### Workflow 3: Review Recent Work

```bash
# Show recent commits
npx ts-node agent.ts "Show last 10 commits"

# Show what changed in last commit
npx ts-node agent.ts "Show diff of HEAD"
```

### Workflow 4: Sync with Remote

```bash
# Pull latest
npx ts-node agent.ts "Pull latest changes from remote"

# Check status
npx ts-node agent.ts "Show git status"

# Push local commits
npx ts-node agent.ts "Push my commits"
```

## Natural Language Examples

The agent understands natural language, so you can ask in various ways:

### Status
- "What's the git status?"
- "Show me what changed"
- "Any uncommitted files?"

### Add
- "Stage everything"
- "Add all modified files"
- "Stage the new tool file"

### Commit
- "Commit with message 'fix: resolve issue'"
- "Create a commit saying 'docs: update guide'"
- "Make a commit for the new feature"

### Push/Pull
- "Push to GitHub"
- "Upload my changes"
- "Get latest from remote"
- "Sync with origin"

### Log
- "Show recent commits"
- "What are the last 5 commits?"
- "Show commit history"

### Branch
- "List branches"
- "Create branch feature/test"
- "Make a new branch called develop"

### Checkout
- "Switch to main"
- "Go to develop branch"
- "Checkout feature/new-tool"

## Error Handling

The tool provides clear error messages:

### Missing Required Parameters
```
Error: 'message' required for commit operation
Error: 'files' array required for add operation
Error: 'branch' required for checkout operation
```

### Git Errors
```
Git error: fatal: not a git repository
Git error: Your branch is up to date with 'origin/main'
Git error: nothing to commit, working tree clean
```

## Best Practices

### 1. Check Status First
Always check status before committing:
```bash
npx ts-node agent.ts "Show status, then stage and commit if there are changes"
```

### 2. Use Conventional Commits
Follow conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

```bash
npx ts-node agent.ts "Commit with message 'feat: add git operations tool'"
```

### 3. Review Before Pushing
```bash
npx ts-node agent.ts "Show last commit and diff, then push if it looks good"
```

### 4. Pull Before Pushing
```bash
npx ts-node agent.ts "Pull latest changes, then push my commits"
```

## Integration with Other Tools

### Combined with Code Search
```bash
npx ts-node agent.ts "Find all TODOs, then create a git commit listing them"
```

### Combined with File Operations
```bash
npx ts-node agent.ts "Create CHANGELOG.md from git log, then commit it"
```

### Combined with Workspace Manager
```bash
npx ts-node agent.ts "Initialize new TypeScript project, then create git repo and make initial commit"
```

## Limitations

1. **Repository Required**: Most operations (except `init`) require an existing Git repository
2. **Git Installation**: Requires Git to be installed on the system
3. **Authentication**: For push/pull, you need configured Git credentials
4. **No Interactive Operations**: Cannot handle operations requiring interactive input (e.g., merge conflicts)
5. **Working Directory**: Operations run in current directory

## Troubleshooting

### "Not a git repository"
**Solution:** Initialize repository first:
```bash
npx ts-node agent.ts "Initialize git repository"
```

### "Nothing to commit"
**Solution:** Make changes first or check status:
```bash
npx ts-node agent.ts "Show git status"
```

### "Permission denied (publickey)"
**Solution:** Configure SSH keys or use HTTPS with credentials

### "Diverged branches"
**Solution:** Pull first, then push:
```bash
npx ts-node agent.ts "Pull changes then push"
```

## Advanced Usage

### Multi-Step Operations
```bash
npx ts-node agent.ts "
1. Check git status
2. If there are changes, stage them all
3. Create commit with message 'chore: cleanup'
4. Show the commit log
5. Push to origin
"
```

### Conditional Operations
```bash
npx ts-node agent.ts "Check if working tree is clean, if not, show me what changed"
```

### Batch Operations
```bash
npx ts-node agent.ts "
For each .ts file modified:
1. Stage it
2. Create individual commits
"
```

## Security Notes

- Commit messages are escaped to prevent command injection
- Operations run with user's Git configuration and permissions
- No sensitive data is exposed in tool responses
- Credentials are managed by Git (not by the agent)

## Future Enhancements

Potential additions to consider:
- Git stash operations
- Rebase support
- Cherry-pick operations
- Tag management
- Submodule support
- GitHub/GitLab API integration

---

**Tip**: Combine git operations with other agent tools for powerful workflows! For example, analyze code, make changes, commit, and push - all in one command.