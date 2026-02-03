# 🏗️ Agent Architecture

## Overview

This agent follows the architecture described by Geoffrey Huntley: **"300 lines of code in a loop with LLM tokens"**.

## Main Components

```
┌─────────────────────────────────────────┐
│         User Input (CLI)                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         Agent Loop (main)               │
│  ┌─────────────────────────────────┐   │
│  │  1. Build Messages Array        │   │
│  │  2. Call Anthropic API          │   │
│  │  3. Check Stop Reason           │   │
│  │  4. Execute Tools if needed     │   │
│  │  5. Add Results to Messages     │   │
│  │  6. Loop or Exit                │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         Tool Executor                    │
│  ┌──────────────────────────────────┐  │
│  │  readFile()                      │  │
│  │  listFiles()                     │  │
│  │  runBash()                       │  │
│  │  editFile()                      │  │
│  └──────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         File System / OS                │
└─────────────────────────────────────────┘
```

## The Agentic Loop in Detail

### Phase 1: Initialization

```typescript
const messages = [{ role: "user", content: userMessage }];
const tools = [readFileTool, listFilesTool, bashTool, editFileTool];
```

The agent starts with:
- The user's message
- The definition of the 4 available tools

### Phase 2: Inferencing Loop

```typescript
while (true) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514", // The "digital squirrel"
    max_tokens: 4096,
    tools: tools,
    messages: messages,
  });
  // ...
}
```

**Why Claude Sonnet?**
- It's "agentic" → biased toward action
- It wants to make tool calls (like a squirrel chasing nuts)
- Doesn't waste time thinking → acts incrementally

### Phase 3: Decision Making

```typescript
if (response.stop_reason === "end_turn") {
  // Done! Show response and exit
  break;
}

if (response.stop_reason === "tool_use") {
  // Claude wants to use a tool
  // → execute and continue the loop
}
```

**Possible Stop Reasons:**
- `end_turn`: Claude is done, no tool needed
- `tool_use`: Claude wants to call one or more tools
- `max_tokens`: Reached token limit (rare)

### Phase 4: Tool Execution

```typescript
for (const block of response.content) {
  if (block.type === "tool_use") {
    const result = await executeTool(block.name, block.input);

    toolResults.push({
      type: "tool_result",
      tool_use_id: block.id,
      content: result,
    });
  }
}
```

**Tool Flow:**
1. Claude decides: "I need tool X"
2. Provides `tool_name` and `input`
3. Agent executes the corresponding function
4. Result is added to messages
5. Loop restarts with the new context

### Phase 5: Context Building

```typescript
messages.push({
  role: "assistant",
  content: response.content,
});

messages.push({
  role: "user",
  content: toolResults,
});
```

**Important**: Each iteration builds the context window:
```
[User: "Create fizzbuzz.ts"]
[Assistant: "Using edit_file tool"]
[User: Tool Result: "File created"]
[Assistant: "Now I'll run it with bash"]
[User: Tool Result: "1 2 Fizz..."]
[Assistant: "Here's the result!"]
```

## The 4 Primitives

### 1. Read File Tool

```typescript
async function readFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, "utf-8");
  return content;
}
```

**Use Cases:**
- Read existing code
- Analyze contents
- Verify output

### 2. List Files Tool

```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  return files.map(f => `${f.isDirectory() ? "📁" : "📄"} ${f.name}`).join("\n");
}
```

**Use Cases:**
- Explore project structure
- Find specific files
- Verify file existence

### 3. Bash Tool

```typescript
async function runBash(command: string): Promise<string> {
  const { stdout, stderr } = await execAsync(command);
  return stdout || stderr;
}
```

**Use Cases:**
- Run scripts
- Install dependencies
- Test code
- Git operations

### 4. Edit File Tool

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  if (oldStr === "") {
    // Create new file
    await fs.writeFile(filePath, newStr, "utf-8");
  } else {
    // Modify existing file
    const content = await fs.readFile(filePath, "utf-8");
    await fs.writeFile(filePath, content.replace(oldStr, newStr), "utf-8");
  }
  return "Success";
}
```

**Use Cases:**
- Create new files
- Modify existing code
- Refactoring

## Key Architecture Lessons

### 1. "Less is More" in Context Window

```typescript
// ❌ BAD: Allocates too much
tools: [tool1, tool2, tool3, ..., tool50] // 76k tokens!

// ✅ GOOD: Only necessary tools
tools: [readFile, listFiles, bash, editFile] // ~2k tokens
```

**Geoffrey's Rule**:
> "The more you allocate to the context window, the worse the results"

### 2. Tool Descriptions Matter

```typescript
// ❌ BAD
description: "Reads files"

// ✅ GOOD
description: "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names."
```

Descriptions are **billboards** that nudge Claude's latent space.

### 3. One Task per Context Window

```typescript
// ❌ BAD: Reuses the same agent loop
agent("Build API") → agent("Research meerkats") → agent("Design UI")

// ✅ GOOD: New loop for each task
agent("Build API") // Clear context
agent("Research meerkats") // Fresh start
agent("Design UI") // Clean slate
```

**Why?** The context gets contaminated:
- API + meerkats → UI with meerkat facts in the API 🤦

## Complete Sequence Diagram

```
User
  │
  ├─→ "Create fizzbuzz.ts and run it"
  │
  ↓
Agent Loop (Iteration 1)
  │
  ├─→ Claude: Analyze request
  │   └─→ Decision: Need edit_file tool
  │
  ├─→ Execute: editFile("fizzbuzz.ts", "", "code...")
  │   └─→ Result: "File created"
  │
  ↓
Agent Loop (Iteration 2)
  │
  ├─→ Claude: File created, now need to run it
  │   └─→ Decision: Need bash tool
  │
  ├─→ Execute: runBash("ts-node fizzbuzz.ts")
  │   └─→ Result: "1\n2\nFizz\n4\nBuzz..."
  │
  ↓
Agent Loop (Iteration 3)
  │
  ├─→ Claude: Got results, task complete
  │   └─→ Decision: end_turn
  │
  └─→ Show final response to user
```

## Future Extensions

### 5. Search Tool (Next Step)
```typescript
const searchTool: Tool = {
  name: "code_search",
  description: "Search code using ripgrep",
  // Geoffrey uses ripgrep under the hood!
};
```

### 6. MCP Integration
You can add Model Context Protocol servers:
```typescript
tools: [...basicTools, ...mcpTools]
```

**Warning**: Each MCP tool allocates context!

### 7. Oracle Pattern
Wire GPT-4 as a tool for "reasoning":
```typescript
const oracleTool: Tool = {
  name: "oracle",
  description: "Ask GPT-4 for deep analysis",
};
```

## Performance Considerations

### Token Usage
- **System Prompt**: ~500 tokens
- **Tool Definitions**: ~2k tokens for 4 tools
- **Conversation History**: Grows with each iteration
- **Available**: ~176k tokens on 200k context window

### Loop Iterations
- Simple tasks: 1-3 iterations
- Complex tasks: 5-10 iterations
- Multi-step workflows: 10-20 iterations

### Cost per Task
```
Simple (3 iterations): ~$0.01
Medium (7 iterations): ~$0.03
Complex (15 iterations): ~$0.07
```

## Best Practices

1. **Clear Tool Descriptions**: Help Claude choose correctly
2. **Error Handling**: Every tool must handle errors
3. **Logging**: Console.log for debugging
4. **Context Management**: One task, one loop
5. **Tool Efficiency**: Fewer tools = better results

## Conclusion

This architecture demonstrates Geoffrey's principle:

> "There's no magic. It's just 300 lines of code running in a loop with LLM tokens."

The intelligence isn't in the harness (our code), but in the **model** (Claude Sonnet) which:
- Knows when to call tools
- Knows which parameters to pass
- Knows when to stop

Our job is just to:
1. Define clear tools
2. Execute them correctly
3. Run the loop

**That's it!** 🎯
