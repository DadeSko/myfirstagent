# 🧪 Test Examples for the Agent

**Important Note**: All examples use `npx ts-node` instead of just `ts-node`. This always works without needing global installations!

## Basic Tests

### 1. List Files
```bash
npx ts-node agent.ts "Show me all files in this directory"
```

### 2. Read File
```bash
npx ts-node agent.ts "Read the contents of README.md"
```

### 3. Create Simple File
```bash
npx ts-node agent.ts "Create a file called hello.txt with 'Hello from my first agent!' written in it"
```

### 4. Execute Command
```bash
npx ts-node agent.ts "Tell me how many TypeScript files are in this directory"
```

## Advanced Tests

### 5. FizzBuzz (like Geoffrey)
```bash
npx ts-node agent.ts "Create a file fizzbuzz.ts that implements fizzbuzz up to 20 and run it to verify it works"
```

### 6. Code Analysis
```bash
npx ts-node agent.ts "Read agent.ts and give me a summary of the main functions"
```

### 7. Refactoring
```bash
npx ts-node agent.ts "Create a simplified version of agent.ts called simple-agent.ts that only has the read_file tool"
```

### 8. Multi-step Task
```bash
npx ts-node agent.ts "Create a directory called examples, then create 3 files inside: example1.ts, example2.ts, example3.ts, each with a simple console.log"
```

## Creative Tests

### 9. Riddle Test (inspired by Geoffrey)
```bash
# First create the riddle
echo "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?" > riddle.txt

# Then ask the agent
npx ts-node agent.ts "Read riddle.txt and tell me the answer"
```

### 10. Documentation Generation
```bash
npx ts-node agent.ts "Analyze agent.ts and create an ARCHITECTURE.md file that explains how the agent works"
```

### 11. Test Suite Creator
```bash
npx ts-node agent.ts "Create a file test.ts with Jest that tests the readFile, listFiles, and runBash functions"
```

### 12. Package Creator
```bash
npx ts-node agent.ts "Create a new package.json for a project called 'my-tool' with TypeScript and the necessary base dependencies"
```

## Debugging Tests

### 13. Error Handling
```bash
npx ts-node agent.ts "Try to read a file that doesn't exist called nonexistent.txt and tell me what happens"
```

### 14. Performance Check
```bash
npx ts-node agent.ts "Run the command 'ls -la' and tell me how many files you see"
```

## Real Workflow Tests

### 15. Blog Post Creator
```bash
npx ts-node agent.ts "Create a structure for a markdown blog post called 'my-agent-journey.md' with title, introduction, 3 sections and conclusion"
```

### 16. Config File Generator
```bash
npx ts-node agent.ts "Create an appropriate .gitignore file for a TypeScript/Node project"
```

### 17. Script Generator
```bash
npx ts-node agent.ts "Create a bash script called setup.sh that installs dependencies and configures the environment"
```

## Testing Tips

1. **Start Simple**: Test one tool at a time
2. **Then Combine**: Do tasks that require multiple tools together
3. **Watch the Loop**: See how Claude decides which tools to use
4. **Experiment**: Try ambiguous queries and see how Claude interprets them

## What to Observe

- ⚙️ **Tool Selection**: Does Claude choose the right tool?
- 🔄 **Loop Behavior**: How many iterations are needed?
- ✅ **Success Rate**: Is the task completed correctly?
- 🐛 **Error Handling**: How does it handle errors?

## Questions to Ask Yourself

- Which tools are used most often?
- Are there tools missing for your use cases?
- How could you extend the agent for your workflow?
- What limitations have you found?

---

Remember: **"300 lines of code in a loop"** - Geoffrey Huntley
