# ⚡ Quick Start - 5 Minutes to Your First Agent

## 🎯 Goal
Have your agent running in 5 minutes following Geoffrey Huntley.

## 📋 Pre-Flight Checklist

- [ ] Node.js installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Anthropic API key ready ([Get it here](https://console.anthropic.com/settings/keys))

## 🚀 Setup (2 minutes)

```bash
# 1. Automatic setup
chmod +x setup.sh
./setup.sh

# 2. Configure API key
export ANTHROPIC_API_KEY='sk-ant-...'

# ✅ Done!
```

## 🧪 First Test (30 seconds)

```bash
# Simplest possible test
npx ts-node agent.ts "List all files in this directory"
```

**Note**: Use `npx ts-node` (with npx in front) - this always works without global installations!

**Expected output:**
```
🤖 Agent starting...

User: List all files in this directory

Stop reason: tool_use

🔧 Tool: list_files
   Input: {
     "path": "."
   }
   ...

🤖 Claude:
Here are the files in the directory...

✅ Agent finished
```

## 🎓 Second Test - FizzBuzz (1 minute)

```bash
npx ts-node agent.ts "Create fizzbuzz.ts and run it"
```

**What happens:**
1. 🔧 Tool: `edit_file` → Creates fizzbuzz.ts
2. 🔧 Tool: `bash` → Runs `ts-node fizzbuzz.ts`
3. ✅ Output: `1 2 Fizz 4 Buzz...`

## 📊 What Are You Seeing?

### The Loop in Action
```
User Input
    ↓
Claude thinks → "Need edit_file"
    ↓
Executes → Creates file
    ↓
Claude thinks → "Now need bash"
    ↓
Executes → Runs script
    ↓
Claude thinks → "Task complete"
    ↓
Shows result
```

### The 4 Tools in Use

| Tool | When It's Used | Example |
|------|----------------|---------|
| 📖 `read_file` | Reading contents | "Read README.md" |
| 📁 `list_files` | Exploring directories | "What's in here?" |
| ⚙️ `bash` | Running commands | "Run the test" |
| ✏️ `edit_file` | Creating/modifying | "Create file.ts" |

## 💡 Quick Tests to Try

### Test 1: Read
```bash
npx ts-node agent.ts "Read the README and tell me what it's about"
```

### Test 2: Create
```bash
npx ts-node agent.ts "Create hello.txt with 'Hello from my agent!'"
```

### Test 3: Execute
```bash
npx ts-node agent.ts "Run 'date' and tell me what day it is"
```

### Test 4: Multi-step
```bash
npx ts-node agent.ts "Create test.js with console.log('works'), run it, then delete it"
```

## 🐛 Quick Troubleshooting

### Error: "ANTHROPIC_API_KEY not found"
```bash
export ANTHROPIC_API_KEY='your-key-here'
```

### Error: "ts-node: command not found"
```bash
npm install
```

### Error: Tool execution failed
- Check that the file path is correct
- Verify directory permissions

## 📈 Complexity Levels

### Level 1: Single Tool ⭐
One tool per task
```bash
npx ts-node agent.ts "List files"
```

### Level 2: Multi Tool ⭐⭐
Multiple tools in sequence
```bash
npx ts-node agent.ts "Create file.txt then read it"
```

### Level 3: Complex Workflow ⭐⭐⭐
Articulated workflow
```bash
npx ts-node agent.ts "Analyze agent.ts, create a summary.md, then run it with cat"
```

## 🎯 5-Minute Challenge

Try to have the agent do this complete task:

```bash
npx ts-node agent.ts "Create a directory called test-project, then create 3 files inside: README.md with title 'My Project', a basic package.json, and index.ts with a hello world. Then show me the created structure."
```

**Expect:**
- 🔧 bash → `mkdir test-project`
- 🔧 edit_file → Creates README.md
- 🔧 edit_file → Creates package.json
- 🔧 edit_file → Creates index.ts
- 🔧 list_files → Shows structure

## 🧠 What Have You Learned?

In the first 5 minutes you've seen:
1. ✅ How the agentic loop works
2. ✅ How Claude chooses tools
3. ✅ How tools are executed in sequence
4. ✅ How context builds iteration after iteration

## 📚 Next Steps (After the 5 Minutes)

1. **Read ARCHITECTURE.md** → Understand the loop in depth
2. **Read EXAMPLES.md** → Try more test cases
3. **Experiment** → Modify tool descriptions
4. **Extend** → Add the 5th tool (search)

## 💭 Geoffrey's Wisdom

> "It's not that hard to build a coding agent. It's 300 lines of code running in a loop with LLM tokens."

You just built one of these agents in 5 minutes! 🎉

## 🔥 Pro Tips

1. **Watch the Console Log**: Every tool call is logged
2. **Experiment with Vague Queries**: See how Claude interprets them
3. **Try Multi-Step Tasks**: Claude is good at breaking them down
4. **Don't Be Afraid of Errors**: They're part of learning

## ✨ Celebrate!

You just:
- ✅ Built your first coding agent
- ✅ Understood the agentic loop
- ✅ Saw the 4 primitives in action
- ✅ Ran complex tasks

**This is just the beginning.** 🚀

---

**Remember**:
> "Go forward and build." — Geoffrey Huntley

Next: Open ARCHITECTURE.md and understand how it works under the hood! 🏗️
