# 🛡️ Error Handling in Agents - Deep Dive

Complete guide on how to handle errors in agents in a robust and professional manner.

---

## 🎯 Why is Error Handling Critical?

Agents interact with:
- ❌ File system (file might not exist)
- ❌ Shell commands (command might fail)
- ❌ Network (API might be down)
- ❌ User input (might be malformed)

**Without error handling**: The agent crashes and the user doesn't know why! 💥

**With error handling**: The agent handles the error, informs Claude, Claude informs the user, and maybe retries! ✅

---

## 📊 The 3 Levels of Error Handling

```
┌─────────────────────────────┐
│  1. Tool Level              │  ← Catches specific errors
│     (readFile, bash, etc)   │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│  2. Executor Level          │  ← Catches tool execution errors
│     (executeTool function)  │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│  3. Loop Level              │  ← Catches API call errors
│     (agentLoop function)    │
└─────────────────────────────┘
```

---

## 🔧 Level 1: Tool-Level Error Handling

### Basic Pattern: Try-Catch with Clear Message

```typescript
async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    console.log(`✓ Read file: ${filePath} (${content.length} bytes)`);
    return content;
  } catch (error) {
    // ⬇️ Return ERROR MESSAGE, don't throw!
    return `Error reading file: ${(error as Error).message}`;
  }
}
```

**Why NOT throw?**

```typescript
// ❌ BAD - Crashes the entire agent
async function readFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, "utf-8");
  return content;  // If it fails → CRASH!
}

// ✅ GOOD - Claude receives the error and can react
async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    return `Error reading file: ${(error as Error).message}`;
    // Claude sees this message and can try something else!
  }
}
```

### Example: bash Tool

```typescript
async function runBash(command: string): Promise<string> {
  try {
    console.log(`⚙️  Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    const output = stdout || stderr;
    console.log(`✓ Command completed (${output.length} bytes)`);
    return output;
  } catch (error) {
    // ⬇️ Detailed error message
    const err = error as Error & { code?: number; stderr?: string };
    return `Error executing command: ${err.message}${err.stderr ? '\n' + err.stderr : ''}`;
  }
}
```

**What happens in practice**:

```typescript
// User asks: "Execute command 'nonexistent-command'"
// Claude calls: bash({ command: "nonexistent-command" })

// ❌ Without error handling:
// → CRASH! Agent dies

// ✅ With error handling:
// → Returns: "Error executing command: command not found: nonexistent-command"
// → Claude receives this message
// → Claude responds: "The command doesn't exist. Would you like to try something else?"
```

### Example: edit_file Tool

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  try {
    if (oldStr === "") {
      // Create new file
      await fs.writeFile(filePath, newStr, "utf-8");
      console.log(`✓ Created new file: ${filePath} (${newStr.length} bytes)`);
      return `Successfully created file ${filePath}`;
    } else {
      // Modify existing file
      const content = await fs.readFile(filePath, "utf-8");

      // ⬇️ VALIDATION: does old_str exist in the file?
      if (!content.includes(oldStr)) {
        return `Error: Could not find "${oldStr}" in ${filePath}`;
      }

      const newContent = content.replace(oldStr, newStr);
      await fs.writeFile(filePath, newContent, "utf-8");
      console.log(`✓ Edited file: ${filePath}`);
      return `Successfully edited file ${filePath}`;
    }
  } catch (error) {
    return `Error editing file: ${(error as Error).message}`;
  }
}
```

**Note**: Besides try-catch, we also have **logical validation**!

---

## 🎮 Level 2: Executor-Level Error Handling

### Pattern: Wrapper with Fallback

```typescript
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  try {
    switch (toolName) {
      case "read_file":
        return await readFile(toolInput.path);

      case "list_files":
        return await listFiles(toolInput.path || ".");

      case "bash":
        return await runBash(toolInput.command);

      case "edit_file":
        return await editFile(
          toolInput.path,
          toolInput.old_str,
          toolInput.new_str
        );

      default:
        // ⬇️ Unknown tool
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    // ⬇️ Catch-all for unexpected errors
    return `Unexpected error executing ${toolName}: ${(error as Error).message}`;
  }
}
```

**What it protects**:
- ✅ Tool name typo/unknown
- ✅ Uncaught errors in individual tools
- ✅ Input parsing issues

---

## 🔄 Level 3: Loop-Level Error Handling

### Pattern: Retry with Backoff

```typescript
async function agentLoop(userMessage: string) {
  console.log("\n🤖 Agent starting...\n");

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage }
  ];

  const MAX_ITERATIONS = 20;  // ⬅️ Iteration limit
  let iterations = 0;

  try {
    while (true) {
      iterations++;

      // ⬇️ Protection against infinite loop
      if (iterations > MAX_ITERATIONS) {
        console.log(`⚠️  Reached max iterations (${MAX_ITERATIONS})`);
        break;
      }

      // ⬇️ API call with error handling
      let response;
      try {
        response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          tools: tools,
          messages: messages,
        });
      } catch (error) {
        // ⬇️ API errors (rate limit, network, etc)
        console.error("❌ API Error:", error);

        // If it's rate limit, you might retry
        if ((error as any).status === 429) {
          console.log("⏳ Rate limited, waiting 60s...");
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;  // Retry
        }

        throw error;  // Other errors → exit
      }

      // ... rest of the loop
    }
  } catch (error) {
    // ⬇️ Final catch
    console.error("\n❌ Fatal error in agent loop:");
    console.error(error);
    throw error;
  }

  console.log("\n✅ Agent finished\n");
}
```

---

## 🎨 Advanced Patterns

### 1. Error Recovery with Retry

```typescript
async function readFileWithRetry(
  filePath: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      lastError = error as Error;
      console.log(`⚠️  Retry ${i + 1}/${maxRetries} for ${filePath}`);

      // Wait before retry (exponential backoff)
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  return `Error reading file after ${maxRetries} retries: ${lastError?.message}`;
}
```

### 2. Validation Before Execution

```typescript
async function runBash(command: string): Promise<string> {
  // ⬇️ Input validation
  if (!command || command.trim() === "") {
    return "Error: Command cannot be empty";
  }

  // ⬇️ Safety check (optional)
  const dangerousCommands = ["rm -rf /", ":(){ :|:& };:"];
  if (dangerousCommands.some(cmd => command.includes(cmd))) {
    return "Error: Dangerous command detected and blocked";
  }

  try {
    const { stdout, stderr } = await execAsync(command);
    return stdout || stderr;
  } catch (error) {
    return `Error executing command: ${(error as Error).message}`;
  }
}
```

### 3. Structured Error Objects

```typescript
interface ToolResult {
  success: boolean;
  data?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

async function readFileStructured(filePath: string): Promise<ToolResult> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return {
      success: true,
      data: content
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return {
      success: false,
      error: {
        code: err.code || "UNKNOWN",
        message: err.message,
        details: { path: filePath }
      }
    };
  }
}

// Usage:
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  if (toolName === "read_file") {
    const result = await readFileStructured(toolInput.path);

    if (result.success) {
      return result.data!;
    } else {
      // ⬇️ We can decide what to do based on the code!
      if (result.error?.code === "ENOENT") {
        return `File not found: ${toolInput.path}. Would you like me to create it?`;
      }
      return `Error: ${result.error?.message}`;
    }
  }
  // ...
}
```

---

## 🔍 Debugging Error Handling

### Strategic Logging

```typescript
async function runBash(command: string): Promise<string> {
  // ⬇️ Log BEFORE execution
  console.log(`⚙️  Executing: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command);
    const output = stdout || stderr;

    // ⬇️ Log SUCCESS with details
    console.log(`✓ Command completed (${output.length} bytes)`);

    return output;
  } catch (error) {
    const err = error as Error;

    // ⬇️ Log ERROR with details
    console.error(`❌ Command failed: ${command}`);
    console.error(`   Error: ${err.message}`);

    return `Error executing command: ${err.message}`;
  }
}
```

**Output when successful**:
```
⚙️  Executing: ls -la
✓ Command completed (1245 bytes)
```

**Output when it fails**:
```
⚙️  Executing: nonexistent-command
❌ Command failed: nonexistent-command
   Error: Command failed: nonexistent-command
```

### Error Context

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  const context = {
    file: filePath,
    operation: oldStr === "" ? "create" : "edit",
    oldLength: oldStr.length,
    newLength: newStr.length
  };

  try {
    console.log(`📝 Editing file:`, context);

    // ... operations ...

    console.log(`✓ Success:`, context);
    return `Successfully ${context.operation}d file ${filePath}`;

  } catch (error) {
    console.error(`❌ Failed:`, context, error);
    return `Error ${context.operation}ing file: ${(error as Error).message}`;
  }
}
```

---

## 📊 Error Handling Checklist

### For Every Tool Function

- [ ] ✅ Wrapped in try-catch
- [ ] ✅ Return error message (don't throw)
- [ ] ✅ Input validation
- [ ] ✅ Meaningful error messages
- [ ] ✅ Logging (success & failure)

### For executeTool

- [ ] ✅ Default case for unknown tools
- [ ] ✅ Catch-all error handler
- [ ] ✅ Type safety checks

### For agentLoop

- [ ] ✅ API call error handling
- [ ] ✅ Max iterations limit
- [ ] ✅ Rate limit handling
- [ ] ✅ Final catch-all

---

## 🎯 Best Practices

### 1. Fail Gracefully

```typescript
// ❌ BAD - Crashes everything
async function readFile(path: string): Promise<string> {
  return await fs.readFile(path, "utf-8");
}

// ✅ GOOD - Returns error as string
async function readFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, "utf-8");
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}
```

### 2. Be Specific

```typescript
// ❌ BAD - Generic message
catch (error) {
  return "Error";
}

// ✅ GOOD - Detailed message
catch (error) {
  return `Error reading file ${filePath}: ${(error as Error).message}`;
}
```

### 3. Log Everything

```typescript
// ❌ BAD - Silent failure
try {
  await doSomething();
} catch {}

// ✅ GOOD - Log for debugging
try {
  console.log("Starting operation...");
  await doSomething();
  console.log("✓ Success");
} catch (error) {
  console.error("❌ Failed:", error);
}
```

### 4. Validate Input

```typescript
async function runBash(command: string): Promise<string> {
  // ⬇️ Validation BEFORE try-catch
  if (!command || command.trim() === "") {
    return "Error: Command cannot be empty";
  }

  try {
    // ... execution ...
  } catch (error) {
    // ...
  }
}
```

---

## 🧪 Testing Error Handling

### Test Edge Cases

```bash
# Test 1: Non-existent file
npx ts-node agent.ts "Read file nonexistent.txt"

# Expected: "Error reading file: ENOENT: no such file or directory"

# Test 2: Invalid command
npx ts-node agent.ts "Execute command 'command-does-not-exist'"

# Expected: "Error executing command: command not found"

# Test 3: Edit on non-existent file
npx ts-node agent.ts "Edit hello.txt replacing 'x' with 'y'"

# Expected: "Error reading file: ENOENT..." or file creation if handled

# Test 4: Directory instead of file
npx ts-node agent.ts "Read node_modules"

# Expected: "Error: EISDIR: illegal operation on a directory"
```

---

## 🎓 Real-World Example

Here's how it would handle an error in a complete flow:

```
User: "Create test.txt with 'hello', read it, then delete it"

Step 1: edit_file("test.txt", "", "hello")
  → Success: "Created test.txt"

Step 2: read_file("test.txt")
  → Success: "hello"

Step 3: bash("rm test.txt")
  → Success: "" (no output)

✅ All good!
```

```
User: "Read nonexistent.txt"

Step 1: read_file("nonexistent.txt")
  → try { fs.readFile(...) }
  → catch (error) {
       return "Error reading file: ENOENT: no such file or directory"
     }
  → Claude receives: "Error reading file: ENOENT..."
  → Claude responds: "The file nonexistent.txt doesn't exist. Would you like me to create it?"

✅ Error handled gracefully!
```

---

## 💡 Pro Tips

1. **Return, Don't Throw**: In tools, return error messages
2. **Be Descriptive**: Include file path, command, etc. in the error
3. **Log Everything**: Success and failure
4. **Validate First**: Check input before expensive operations
5. **Fail Fast**: If something is clearly wrong, return error immediately
6. **Context Matters**: Include relevant info in the error message

---

## 🎯 Practical Exercise

Add robust error handling to this function:

```typescript
// ❌ Version without error handling
async function createDirectory(dirPath: string): Promise<string> {
  await fs.mkdir(dirPath, { recursive: true });
  return `Created directory ${dirPath}`;
}

// ✅ Your version with error handling
async function createDirectory(dirPath: string): Promise<string> {
  // Your code here!
  // Consider:
  // - empty path?
  // - path already exists?
  // - missing permissions?
  // - try-catch?
  // - logging?
}
```

**Solution**:
```typescript
async function createDirectory(dirPath: string): Promise<string> {
  // Validation
  if (!dirPath || dirPath.trim() === "") {
    return "Error: Directory path cannot be empty";
  }

  try {
    console.log(`📁 Creating directory: ${dirPath}`);

    // Check if already exists
    try {
      await fs.access(dirPath);
      return `Directory ${dirPath} already exists`;
    } catch {
      // Doesn't exist, proceed to create
    }

    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
    return `Successfully created directory ${dirPath}`;

  } catch (error) {
    const err = error as Error;
    console.error(`❌ Failed to create directory ${dirPath}:`, err);
    return `Error creating directory: ${err.message}`;
  }
}
```

---

**Remember**: Good error handling is what separates a toy project from production-ready code! 🛡️
