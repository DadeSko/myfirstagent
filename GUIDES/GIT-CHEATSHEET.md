# 🎯 Git Quick Reference - Essential Commands

Quick cheat sheet for managing your GitHub repository.

---

## 🚀 Initial Setup (One Time Only)

```bash
# Initialize repository
git init

# Configure your name (if you haven't already)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Connect to GitHub repository
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Verify remote
git remote -v
```

---

## 📝 Daily Workflow

### 1. Check Status

```bash
# See what has changed
git status

# See differences in detail
git diff
```

### 2. Add Changes

```bash
# Add everything
git add .

# Add specific file
git add agent.ts

# Add multiple files
git add agent.ts README.md
```

### 3. Commit

```bash
# Commit with message
git commit -m "✨ Add new feature"

# Commit with multi-line message
git commit -m "✨ Add search tool

- Implement ripgrep integration
- Add search_tool.ts
- Update documentation"
```

### 4. Push to GitHub

```bash
# Push (after the first push -u)
git push

# First push (only the first time)
git push -u origin main
```

---

## 🔄 Common Commands

### View History

```bash
# Simple log
git log

# Compact log (better)
git log --oneline

# Log with graph
git log --oneline --graph --all

# Last 5 commits
git log --oneline -5
```

### Undo Changes

```bash
# Discard changes in a file (NOT committed)
git checkout -- agent.ts

# Discard ALL changes (NOT committed)
git checkout .

# Remove file from staging area (but keep changes)
git reset agent.ts

# Go back to previous commit (CAUTION!)
git reset --hard HEAD~1
```

### Remove Files

```bash
# Remove file from repository AND filesystem
git rm agent.ts

# Remove from repository but KEEP in filesystem
git rm --cached .env

# Commit the removal
git commit -m "🗑️ Remove file"
```

---

## 🌿 Branching (Advanced)

```bash
# Create new branch
git branch feature-search

# Switch to a branch
git checkout feature-search

# Create AND switch to new branch
git checkout -b feature-search

# List all branches
git branch

# Merge branch into main
git checkout main
git merge feature-search

# Delete branch
git branch -d feature-search
```

---

## 🔍 Useful Commands

### View Differences

```bash
# Unstaged differences
git diff

# Staged differences
git diff --cached

# Differences in specific file
git diff agent.ts
```

### Search in Code

```bash
# Search "function" in all files
git grep "function"

# Search only in .ts files
git grep "function" -- "*.ts"
```

### Information

```bash
# Who modified each line
git blame agent.ts

# Info on specific commit
git show <commit-hash>
```

---

## 🆘 Emergencies

### I committed .env by mistake!

```bash
# 1. Remove from tracking
git rm --cached .env

# 2. Add to .gitignore if not already there
echo ".env" >> .gitignore

# 3. Commit
git commit -m "🔒 Remove .env from tracking"

# 4. Push
git push

# 5. IMPORTANT: Regenerate the API key!
```

### I made a wrong commit

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (DELETE changes)
git reset --hard HEAD~1
```

### I pushed by mistake

```bash
# Undo last commit on GitHub (CAUTION!)
git reset --hard HEAD~1
git push --force
```

---

## 📊 Emojis for Commit Messages

| Emoji | Code | Use |
|-------|------|-----|
| 🎉 | `:tada:` | Initial commit |
| ✨ | `:sparkles:` | New feature |
| 🐛 | `:bug:` | Bug fix |
| 📝 | `:memo:` | Documentation |
| ♻️ | `:recycle:` | Refactoring |
| 🔧 | `:wrench:` | Config files |
| 🚀 | `:rocket:` | Deploy |
| 🔒 | `:lock:` | Security |
| 🗑️ | `:wastebasket:` | Remove code/files |
| 🎨 | `:art:` | Improve structure |

---

## ✅ Checklist Before Push

```bash
# 1. Verify status
git status

# 2. Verify that .env is NOT included
# If you see .env in "Changes to be committed", STOP!

# 3. See what you're about to commit
git diff --cached

# 4. If all ok, commit
git commit -m "Message"

# 5. Push
git push
```

---

## 🎯 Common Pattern: Feature Development

```bash
# 1. Create branch for feature
git checkout -b add-search-tool

# 2. Work, commit often
git add .
git commit -m "🚧 WIP: search tool"

# 3. When finished
git add .
git commit -m "✨ Complete search tool implementation"

# 4. Go back to main
git checkout main

# 5. Merge
git merge add-search-tool

# 6. Push
git push

# 7. Delete branch (optional)
git branch -d add-search-tool
```

---

## 📱 Mobile Commands (GitHub.com)

If you're on mobile and want to make quick edits:

1. Go to github.com/your-repo
2. Navigate to the file
3. Click pencil icon (✏️)
4. Edit
5. Commit directly from web

---

## 🔗 Useful Links

- [Git Cheat Sheet PDF](https://education.github.com/git-cheat-sheet-education.pdf)
- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [Gitmoji](https://gitmoji.dev)

---

## 💡 Pro Tips

1. **Commit often**: Better many small commits than one giant one
2. **Clear messages**: "Fix bug" is bad, "🐛 Fix tool execution error in bash_tool" is good
3. **Use branches**: For large features, use separate branches
4. **Pull before push**: If working with others, `git pull` before `git push`
5. **Don't commit secrets**: Never .env, never API keys
6. **.gitignore early**: Add it in the first commit

---

## ⚡ Shortcuts

```bash
# Status
git st  # (after: git config --global alias.st status)

# Quick commit
git commit -am "Message"  # Add + Commit in one (only for already tracked files)

# Compact log
git lg  # (after: git config --global alias.lg "log --oneline --graph")
```

---

**Keep calm and commit on!** 🚀
