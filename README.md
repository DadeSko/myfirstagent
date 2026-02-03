# 🤖 My First Agent - Davide's Coding Agent

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange?style=for-the-badge)

A TypeScript agent built following Geoffrey Huntley's methodology.

## 🎯 Philosophy

As Geoffrey says:
> "300 lines of code in a loop with LLM tokens. It really is that simple."

This agent implements the **6 fundamental primitives** of every professional coding agent:

1. **📖 Read Tool** - Reads files
2. **📁 List Tool** - Lists directories
3. **⚙️ Bash Tool** - Executes commands
4. **✏️ Edit Tool** - Modifies/creates files
5. **🔍 Code Search Tool** - Searches patterns in code (ripgrep)
6. **🔧 Git Operations Tool** - Manages Git operations

## 🚀 Setup

```bash
# Install dependencies
npm install

# Configure your API key
export ANTHROPIC_API_KEY='your-key-here'
```

## 💡 How to Use

```bash
# Example 1: List files
npx ts-node agent.ts "List all TypeScript files in this directory"

# Example 2: Create a file
npx ts-node agent.ts "Create a file called test.txt with the content 'Hello World'"

# Example 3: FizzBuzz (as in Geoffrey's example)
npx ts-node agent.ts "Create fizzbuzz.ts that prints fizzbuzz up to 20 and run it"

# Example 4: Code analysis
npx ts-node agent.ts "Read agent.ts and tell me how many functions are there"

# Example 5: Code Search (new!)
npx ts-node agent.ts "Search for all async functions in the project"

# Example 6: Find TODOs
npx ts-node agent.ts "Find all TODOs and FIXMEs in the code"

# Example 7: Git operations (new!)
npx ts-node agent.ts "Check git status and show recent commits"

# Example 8: Stage and commit
npx ts-node agent.ts "Stage all changes and commit with message 'feat: add new feature'"
```

**Note**: Use `npx ts-node` instead of just `ts-node` if you don't have ts-node installed globally.

## 🧠 How It Works

The agent is built on a **simple loop**:

```typescript
while (true) {
  1. Send message to Claude
  2. Claude decides whether to use tools
  3. If uses tools → execute and return results
  4. If finished → show final response
}
```

### The Agentic Loop

```
User Input
    ↓
[Claude Inference]
    ↓
Tool Call?
    ↓ YES          ↓ NO
Execute Tool   End Turn
    ↓              ↓
Add Result    Show Response
    ↓
[Loop Back]
```

## 🛠️ The 6 Primitives

### 1. Read File Tool
```typescript
await readFile("myfile.txt")
```
Reads the content of a file.

### 2. List Files Tool
```typescript
await listFiles("./src")
```
Lists files and directories.

### 3. Bash Tool
```typescript
await runBash("ls -la")
```
Executes shell commands.

### 4. Edit File Tool
```typescript
await editFile("test.txt", "", "new content")
```
Creates or modifies files.

### 5. Code Search Tool
```typescript
await codeSearch({ pattern: "async function", file_type: "ts" })
```
Searches patterns in code using ripgrep. The 5th primitive according to Geoffrey:
> "What if I were to tell you that there is no magic for indexing source code? Nearly every coding tool uses ripgrep under the hood."

### 6. Git Operations Tool
```typescript
await gitOperations({ operation: "status" })
await gitOperations({ operation: "add", files: ["."] })
await gitOperations({ operation: "commit", message: "feat: new feature" })
```
Manages Git operations like status, add, commit, push, pull, log, diff, branch, and checkout.

## 📚 Documentation

Complete documentation available:

- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup in 5 minutes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Deep dive into the agent architecture
- **[EXAMPLES.md](EXAMPLES.md)** - Test cases and practical examples
- **[LEARNING-JOURNAL.md](LEARNING-JOURNAL.md)** - Technical progress and insights

### In-Depth Technical Guides

- **[TOOL-DEFINITIONS-GUIDE.md](GUIDES/TOOL-DEFINITIONS-GUIDE.md)** - Tool definition structure
- **[ERROR-HANDLING-GUIDE.md](GUIDES/ERROR-HANDLING-GUIDE.md)** - Error handling patterns
- **[FILESYSTEM-GUIDE.md](GUIDES/FILESYSTEM-GUIDE.md)** - Filesystem operations
- **[CODE-SEARCH-GUIDE.md](GUIDES/CODE-SEARCH-GUIDE.mdd)** - Code search implementation
- **[WORKSPACE-MANAGER-GUIDE](GUIDES/WORKSPACE-MANAGER-GUIDE.md)** - Workspace manager tool implementation

### Setup & Troubleshooting

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solutions to common problems
- **[GITHUB-SETUP.md](GITHUB-SETUP.md)** - Guide to publishing on GitHub
- **[GIT-CHEATSHEET.md](GIT-CHEATSHEET.md)** - Essential Git commands

## 🎓 Key Lessons from Geoffrey

### Not All LLMs Are Agentic
- **Agentic** (Claude Sonnet): "digital squirrel" that wants to make tool calls
- **Oracle** (GPT-4): deep thinking, summarization
- **High Safety**: Anthropic, OpenAI
- **Low Safety**: Grok

### Context Window Management
> "Less is more, folks. Less is more."

- Context window is like a Commodore 64
- The more you allocate, the worse the results
- Use **one task per context window**

### The Loop Is Everything
300 lines of code running in a loop with LLM tokens. There's no magic!

## 📊 Project Structure

```
.
├── agent.ts           # The heart of the agent
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── README.md         # This guide
```

## 🔮 Next Steps

Once you master these 6 primitives, you can:

1. ✅ ~~Add a **Search Tool** (ripgrep)~~ - Completed!
2. ✅ ~~Add **Git Operations Tool**~~ - Completed!
3. Implement **MCP servers** to extend capabilities
4. Create specialized agents for specific workflows
5. Build multi-agent orchestrations
6. Add caching and performance optimizations

## 💭 Key Quotes

> "Any disruption or job loss related to AI is not a result of AI itself, but rather a consequence of a lack of personal development."
> — Geoffrey Huntley

> "In 2025, you should be familiar with what a primary key is and how to create an agent."
> — Geoffrey Huntley

## 📚 Resources

### Geoffrey Huntley's Materials
- [Agent Workshop](https://ghuntley.com/agent/) - Complete workshop on how to build agents
- [Workshop Materials (Go)](https://github.com/ghuntley/how-to-build-a-coding-agent) - Go implementation
- [6-Month Recap](https://ghuntley.com/six-month-recap/) - Insights on the future of agents

### Anthropic Documentation
- [Anthropic SDK Docs](https://docs.anthropic.com) - Official documentation
- [Tool Use Guide](https://docs.anthropic.com/en/docs/tool-use) - How to use tools

### Technical References
- [ripgrep](https://github.com/BurntSushi/ripgrep) - The code search tool everyone uses
- [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api) - Filesystem operations

## ✨ Credits

Agent built by **Davide** in the context of the "From Editor to Technical Contributor" program for Effectful Technologies, following the teachings of Geoffrey Huntley.

---

**Remember**: This is just the beginning. As Geoffrey says: "Go forward and build." 🚀